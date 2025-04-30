import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import {
  CreateUploadOutput,
  ApiErrorCode,
  generateId,
  IdType,
  createUploadInputSchema,
  createUploadOutputSchema,
  apiErrorOutputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { mapNode } from '@/lib/nodes';
import { buildFilePath, buildUploadUrl } from '@/lib/files';

export const fileUploadInitRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/',
    schema: {
      body: createUploadInputSchema,
      response: {
        200: createUploadOutputSchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const input = request.body;
      const user = request.user;

      const node = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', input.fileId)
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
          message: 'You do not have access to this file.',
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
        .where('file_id', '=', input.fileId)
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

      const path = buildFilePath(
        node.workspace_id,
        input.fileId,
        file.attributes
      );

      const uploadId = generateId(IdType.Upload);
      const upsertedUpload = await database
        .insertInto('uploads')
        .values({
          file_id: input.fileId,
          upload_id: uploadId,
          workspace_id: node.workspace_id,
          root_id: node.root_id,
          mime_type: file.attributes.mimeType,
          size: file.attributes.size,
          path: path,
          version_id: file.attributes.version,
          created_at: new Date(),
          created_by: request.user.id,
        })
        .onConflict((b) =>
          b.columns(['file_id']).doUpdateSet({
            upload_id: uploadId,
            mime_type: file.attributes.mimeType,
            size: file.attributes.size,
            path: path,
            version_id: file.attributes.version,
            created_at: new Date(),
            created_by: request.user.id,
          })
        )
        .executeTakeFirst();

      if (!upsertedUpload) {
        return reply.code(400).send({
          code: ApiErrorCode.FileUploadInitFailed,
          message: 'Failed to initialize file upload.',
        });
      }

      //generate presigned url for upload
      const presignedUrl = await buildUploadUrl(
        path,
        file.attributes.size,
        file.attributes.mimeType
      );

      const output: CreateUploadOutput = {
        url: presignedUrl,
        uploadId: uploadId,
      };

      return output;
    },
  });

  done();
};
