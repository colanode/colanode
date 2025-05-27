import { PutObjectCommand } from '@aws-sdk/client-s3';
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import {
  ApiErrorCode,
  FileStatus,
  fileUploadOutputSchema,
  apiErrorOutputSchema,
  generateId,
  IdType,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { s3Client } from '@colanode/server/data/storage';
import { config } from '@colanode/server/lib/config';
import { buildFilePath } from '@colanode/server/lib/files';
import { mapNode, updateNode } from '@colanode/server/lib/nodes';

export const fileUploadRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.removeAllContentTypeParsers();

  instance.addContentTypeParser('*', (_request, _payload, done) => {
    done(null);
  });

  instance.route({
    method: 'PUT',
    url: '/:fileId',
    schema: {
      params: z.object({
        workspaceId: z.string(),
        fileId: z.string(),
      }),
      response: {
        200: fileUploadOutputSchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    bodyLimit: 1024 * 1024 * 100, // 100MB
    handler: async (request, reply) => {
      const { workspaceId, fileId } = request.params;
      const user = request.user;

      const node = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', fileId)
        .executeTakeFirst();

      if (!node) {
        return reply.code(404).send({
          code: ApiErrorCode.FileNotFound,
          message: 'File not found.',
        });
      }

      if (node.created_by !== user.id) {
        return reply.code(403).send({
          code: ApiErrorCode.FileOwnerMismatch,
          message: 'You do not have permission to upload to this file.',
        });
      }

      const file = mapNode(node);
      if (file.type !== 'file') {
        return reply.code(400).send({
          code: ApiErrorCode.FileNotFound,
          message: 'This node is not a file.',
        });
      }

      const upload = await database
        .selectFrom('uploads')
        .selectAll()
        .where('file_id', '=', fileId)
        .executeTakeFirst();

      if (upload && upload.uploaded_at) {
        return reply.code(400).send({
          code: ApiErrorCode.FileAlreadyUploaded,
          message: 'This file is already uploaded.',
        });
      }

      const storageUsedRow = await database
        .selectFrom('uploads')
        .select(({ fn }) => [fn.sum('size').as('storage_used')])
        .where('created_by', '=', request.user.id)
        .executeTakeFirst();

      const storageUsed = BigInt(storageUsedRow?.storage_used ?? 0);
      const storageLimit = BigInt(user.storage_limit);

      if (storageUsed >= storageLimit) {
        return reply.code(400).send({
          code: ApiErrorCode.FileUploadInitFailed,
          message: 'You have reached the maximum storage limit.',
        });
      }

      const path = buildFilePath(workspaceId, fileId, file.attributes);

      const stream = request.raw;
      const uploadCommand = new PutObjectCommand({
        Bucket: config.storage.bucketName,
        Key: path,
        Body: stream,
        ContentType: file.attributes.mimeType,
        ContentLength: file.attributes.size,
      });

      try {
        await s3Client.send(uploadCommand);
      } catch (error) {
        console.error(error);
        return reply.code(500).send({
          code: ApiErrorCode.FileUploadInitFailed,
          message: 'Failed to upload file to storage.',
        });
      }

      const result = await updateNode({
        nodeId: fileId,
        userId: request.user.id,
        workspaceId: workspaceId,
        updater(attributes) {
          if (attributes.type !== 'file') {
            throw new Error('Node is not a file');
          }
          attributes.status = FileStatus.Ready;
          return attributes;
        },
      });

      if (result === null) {
        return reply.code(500).send({
          code: ApiErrorCode.FileUploadCompleteFailed,
          message: 'Failed to complete file upload.',
        });
      }

      const upsertedUpload = await database
        .insertInto('uploads')
        .returningAll()
        .values({
          file_id: fileId,
          upload_id: generateId(IdType.Upload),
          workspace_id: workspaceId,
          root_id: node.root_id,
          mime_type: file.attributes.mimeType,
          size: file.attributes.size,
          path: path,
          version_id: file.attributes.version,
          created_at: new Date(),
          created_by: request.user.id,
          uploaded_at: new Date(),
        })
        .onConflict((b) =>
          b.columns(['file_id']).doUpdateSet({
            uploaded_at: new Date(),
          })
        )
        .executeTakeFirst();

      if (!upsertedUpload) {
        return reply.code(500).send({
          code: ApiErrorCode.FileUploadCompleteFailed,
          message: 'Failed to record file upload.',
        });
      }

      return { success: true, uploadId: upsertedUpload.upload_id };
    },
  });

  done();
};
