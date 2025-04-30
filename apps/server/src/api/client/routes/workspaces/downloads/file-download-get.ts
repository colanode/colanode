import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateDownloadOutput,
  hasNodeRole,
  ApiErrorCode,
  extractNodeRole,
  FileStatus,
  createDownloadOutputSchema,
  apiErrorOutputSchema,
} from '@colanode/core';

import { fetchNodeTree, mapNode } from '@/lib/nodes';
import { database } from '@/data/database';
import { buildDownloadUrl } from '@/lib/files';

export const fileDownloadGetRoute: FastifyPluginCallbackZod = (
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
      }),
      response: {
        200: createDownloadOutputSchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
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

      const presignedUrl = await buildDownloadUrl(upload.path);
      const output: CreateDownloadOutput = {
        url: presignedUrl,
      };

      return output;
    },
  });

  done();
};
