import { Readable } from 'stream';

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import {
  hasNodeRole,
  ApiErrorCode,
  extractNodeRole,
  FileStatus,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { s3Client } from '@colanode/server/data/storage';
import { config } from '@colanode/server/lib/config';
import { fetchNodeTree, mapNode } from '@colanode/server/lib/nodes';

export const fileDownloadRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'GET',
    url: '/:fileId',
    schema: {
      params: z.object({
        fileId: z.string(),
        workspaceId: z.string(),
      }),
    },
    handler: async (request, reply) => {
      const fileId = request.params.fileId;

      const tree = await fetchNodeTree(fileId);
      if (tree.length === 0) {
        return reply.code(400).send({
          code: ApiErrorCode.FileNotFound,
          message: 'File not found.',
        });
      }

      const nodes = tree.map((node) => mapNode(node));
      const file = nodes[nodes.length - 1]!;
      if (!file || file.id !== fileId) {
        return reply.code(400).send({
          code: ApiErrorCode.FileNotFound,
          message: 'File not found.',
        });
      }

      if (file.type !== 'file') {
        return reply.code(400).send({
          code: ApiErrorCode.FileNotFound,
          message: 'This node is not a file.',
        });
      }

      if (file.attributes.status !== FileStatus.Ready) {
        return reply.code(400).send({
          code: ApiErrorCode.FileNotReady,
          message: 'File is not ready to be downloaded.',
        });
      }

      const role = extractNodeRole(nodes, request.user.id);
      if (role === null || !hasNodeRole(role, 'viewer')) {
        return reply.code(403).send({
          code: ApiErrorCode.FileNoAccess,
          message: 'You do not have access to this file.',
        });
      }

      const upload = await database
        .selectFrom('uploads')
        .selectAll()
        .where('file_id', '=', fileId)
        .executeTakeFirst();

      if (!upload || !upload.uploaded_at) {
        return reply.code(400).send({
          code: ApiErrorCode.FileUploadNotFound,
          message: 'File upload not found.',
        });
      }

      const command = new GetObjectCommand({
        Bucket: config.storage.bucket,
        Key: upload.path,
      });

      const fileResponse = await s3Client.send(command);
      if (!fileResponse.Body) {
        return reply.code(404).send({
          code: ApiErrorCode.FileNotFound,
          message: 'File not found.',
        });
      }

      if (fileResponse.Body instanceof Readable) {
        reply.header('Content-Type', fileResponse.ContentType);
        return reply.send(fileResponse.Body);
      }

      return reply.code(404).send({
        code: ApiErrorCode.FileNotFound,
        message: 'File not found.',
      });
    },
  });

  done();
};
