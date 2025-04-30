import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  FileStatus,
  ApiErrorCode,
  completeUploadOutputSchema,
  apiErrorOutputSchema,
  completeUploadInputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { mapNode, updateNode } from '@/lib/nodes';
import { fetchFileMetadata } from '@/lib/files';

export const fileUploadCompleteRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'PUT',
    url: '/:fileId',
    schema: {
      params: z.object({
        workspaceId: z.string(),
        fileId: z.string(),
      }),
      body: completeUploadInputSchema,
      response: {
        200: completeUploadOutputSchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const workspaceId = request.params.workspaceId;
      const fileId = request.params.fileId;
      const uploadId = request.body.uploadId;

      const node = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', fileId)
        .executeTakeFirst();

      if (!node) {
        return reply.code(400).send({
          code: ApiErrorCode.FileNotFound,
          message: 'File not found.',
        });
      }

      if (node.created_by !== request.user.id) {
        return reply.code(403).send({
          code: ApiErrorCode.FileOwnerMismatch,
          message: 'You cannot complete this file upload.',
        });
      }

      if (node.workspace_id !== workspaceId) {
        return reply.code(400).send({
          code: ApiErrorCode.WorkspaceMismatch,
          message: 'File does not belong to this workspace.',
        });
      }

      const file = mapNode(node);
      if (file.type !== 'file') {
        return reply.code(400).send({
          code: ApiErrorCode.FileNotFound,
          message: 'This node is not a file.',
        });
      }

      if (file.attributes.status === FileStatus.Ready) {
        return { success: true };
      }

      if (file.attributes.status === FileStatus.Error) {
        return reply.code(400).send({
          code: ApiErrorCode.FileError,
          message: 'File has failed to upload.',
        });
      }

      const upload = await database
        .selectFrom('uploads')
        .selectAll()
        .where('file_id', '=', fileId)
        .executeTakeFirst();

      if (!upload) {
        return reply.code(400).send({
          code: ApiErrorCode.FileUploadNotFound,
          message: 'Upload not found.',
        });
      }

      if (upload.file_id !== fileId || upload.upload_id !== uploadId) {
        return reply.code(400).send({
          code: ApiErrorCode.FileUploadNotFound,
          message: 'Upload not found.',
        });
      }

      const path = upload.path;
      const metadata = await fetchFileMetadata(path);
      if (metadata === null) {
        return reply.code(400).send({
          code: ApiErrorCode.FileNotFound,
          message: 'File not found.',
        });
      }

      if (metadata.size !== file.attributes.size) {
        return reply.code(400).send({
          code: ApiErrorCode.FileSizeMismatch,
          message: 'Uploaded file size does not match expected size',
        });
      }

      if (metadata.mimeType !== file.attributes.mimeType) {
        return reply.code(400).send({
          code: ApiErrorCode.FileMimeTypeMismatch,
          message: 'Uploaded file type does not match expected type',
        });
      }

      const result = await updateNode({
        nodeId: fileId,
        userId: request.account.id,
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

      await database
        .updateTable('uploads')
        .set({
          uploaded_at: new Date(),
        })
        .where('file_id', '=', fileId)
        .execute();

      return { success: true };
    },
  });

  done();
};
