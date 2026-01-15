import { Server } from '@tus/server';
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import {
  ApiErrorCode,
  FileStatus,
  generateId,
  IdType,
  WorkspaceStatus,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { redis } from '@colanode/server/data/redis';
import { config } from '@colanode/server/lib/config';
import { generateUrl } from '@colanode/server/lib/fastify';
import { mapNode, updateNode } from '@colanode/server/lib/nodes';
import { storage } from '@colanode/server/lib/storage';
import { RedisLocker } from '@colanode/server/lib/storage/tus/redis-locker';

const tryDeleteFile = async (path: string): Promise<void> => {
  try {
    await storage.delete(path);
  } catch {
    // Best effort cleanup - ignore errors if file doesn't exist or can't be deleted
  }
};

export const fileUploadTusRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.addContentTypeParser(
    'application/offset+octet-stream',
    (_request, _payload, done) => done(null)
  );

  instance.route({
    method: ['HEAD', 'POST', 'PATCH', 'DELETE'],
    url: '/:fileId/tus',
    schema: {
      params: z.object({
        workspaceId: z.string(),
        fileId: z.string(),
      }),
    },
    handler: async (request, reply) => {
      const { workspaceId, fileId } = request.params;
      const user = request.workspace.user;

      if (request.workspace.status === WorkspaceStatus.Readonly) {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceReadonly,
          message: 'Workspace is readonly and you cannot upload files.',
        });
      }

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

      const path = `files/${workspaceId}/${fileId}_${file.version}${file.extension}`;
      const url = generateUrl(
        request,
        `/client/v1/workspaces/${workspaceId}/files/${fileId}/tus`
      );

      const tusServer = new Server({
        path: '/tus',
        datastore: storage.tusStore,
        locker:
          config.storage.tus.locker.type === 'redis'
            ? new RedisLocker(redis, config.storage.tus.locker.prefix)
            : undefined,
        async onUploadCreate() {
          const upload = await database
            .selectFrom('uploads')
            .selectAll()
            .where('file_id', '=', fileId)
            .executeTakeFirst();

          if (upload && upload.uploaded_at) {
            throw {
              status_code: 400,
              body: JSON.stringify({
                code: ApiErrorCode.FileAlreadyUploaded,
                message: 'This file is already uploaded.',
              }),
            };
          }

          if (request.workspace.maxFileSize) {
            if (file.size > BigInt(request.workspace.maxFileSize)) {
              throw {
                status_code: 400,
                body: JSON.stringify({
                  code: ApiErrorCode.WorkspaceMaxFileSizeExceeded,
                  message:
                    'The file size exceeds the maximum allowed size for this workspace.',
                }),
              };
            }
          }

          const createdUpload = await database
            .insertInto('uploads')
            .returningAll()
            .values({
              file_id: fileId,
              upload_id: generateId(IdType.Upload),
              workspace_id: workspaceId,
              root_id: file.rootId,
              mime_type: file.mimeType,
              size: file.size,
              path: path,
              version_id: file.version,
              created_at: new Date(),
              created_by: request.workspace.user.id,
            })
            .onConflict((oc) =>
              oc.columns(['file_id']).doUpdateSet({
                mime_type: file.mimeType,
                size: file.size,
                path: path,
                version_id: file.version,
              })
            )
            .executeTakeFirst();

          if (!createdUpload) {
            throw {
              status_code: 500,
              body: JSON.stringify({
                code: ApiErrorCode.FileUploadFailed,
                message: 'Failed to create upload record.',
              }),
            };
          }

          return {
            metadata: {
              uploadId: createdUpload.upload_id,
              contentType: file.mimeType,
            },
          };
        },
        async onUploadFinish(_req, upload) {
          const uploadId = upload.metadata?.uploadId;
          if (!uploadId) {
            throw {
              status_code: 500,
              body: JSON.stringify({
                code: ApiErrorCode.FileUploadCompleteFailed,
                message: 'Failed to get upload id from metadata.',
              }),
            };
          }

          const updatedUpload = await database
            .updateTable('uploads')
            .returningAll()
            .set({
              uploaded_at: new Date(),
            })
            .where('file_id', '=', fileId)
            .where('upload_id', '=', uploadId)
            .executeTakeFirst();

          if (!updatedUpload) {
            throw {
              status_code: 500,
              body: JSON.stringify({
                code: ApiErrorCode.FileUploadCompleteFailed,
                message: 'Failed to record file upload.',
              }),
            };
          }

          const result = await updateNode({
            nodeId: fileId,
            userId: request.workspace.user.id,
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
            throw {
              status_code: 500,
              body: JSON.stringify({
                code: ApiErrorCode.FileUploadCompleteFailed,
                message: 'Failed to complete file upload.',
              }),
            };
          }

          const tusInfoPath = `${path}.info`;
          await tryDeleteFile(tusInfoPath);

          return {
            status_code: 200,
            body: JSON.stringify({ uploadId }),
          };
        },
        generateUrl() {
          return url;
        },
        getFileIdFromRequest() {
          return path;
        },
        namingFunction() {
          return path;
        },
      });

      await tusServer.handle(request.raw, reply.raw);
    },
  });

  done();
};
