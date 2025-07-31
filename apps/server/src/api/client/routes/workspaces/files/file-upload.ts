import { S3Store } from '@tus/s3-store';
import { Server } from '@tus/server';
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { ApiErrorCode, FileStatus, generateId, IdType } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { config } from '@colanode/server/lib/config';
import { fetchCounter } from '@colanode/server/lib/counters';
import { buildFilePath, deleteFile } from '@colanode/server/lib/files';
import { mapNode, updateNode } from '@colanode/server/lib/nodes';

const s3Store = new S3Store({
  partSize: 20 * 1024 * 1024,
  s3ClientConfig: {
    endpoint: config.storage.endpoint,
    bucket: config.storage.bucket,
    region: config.storage.region,
    credentials: {
      accessKeyId: config.storage.accessKey,
      secretAccessKey: config.storage.secretKey,
    },
    forcePathStyle: config.storage.forcePathStyle,
  },
});

export const fileUploadRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.addContentTypeParser(
    'application/offset+octet-stream',
    (_request, _payload, done) => done(null)
  );

  instance.route({
    method: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'],
    url: '/:fileId',
    schema: {
      params: z.object({
        workspaceId: z.string(),
        fileId: z.string(),
      }),
    },
    handler: async (request, reply) => {
      const { workspaceId, fileId } = request.params;
      const user = request.user;

      const workspace = await database
        .selectFrom('workspaces')
        .selectAll()
        .where('id', '=', workspaceId)
        .executeTakeFirst();

      if (!workspace) {
        return reply.code(404).send({
          code: ApiErrorCode.WorkspaceNotFound,
          message: 'Workspace not found.',
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

      const path = buildFilePath(workspaceId, fileId, file.attributes);

      const tusServer = new Server({
        path: '/tus',
        datastore: s3Store,
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

          if (file.attributes.size > BigInt(user.max_file_size)) {
            throw {
              status_code: 400,
              body: JSON.stringify({
                code: ApiErrorCode.UserMaxFileSizeExceeded,
                message:
                  'The file size exceeds the maximum allowed size for your account.',
              }),
            };
          }

          if (workspace.max_file_size) {
            if (file.attributes.size > BigInt(workspace.max_file_size)) {
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

          const userStorageUsed = await fetchCounter(
            database,
            `${user.id}.storage.used`
          );

          if (userStorageUsed >= BigInt(user.storage_limit)) {
            throw {
              status_code: 400,
              body: JSON.stringify({
                code: ApiErrorCode.UserStorageLimitExceeded,
                message:
                  'You have reached the maximum storage limit for your account.',
              }),
            };
          }

          if (workspace.storage_limit) {
            const workspaceStorageUsed = await fetchCounter(
              database,
              `${workspaceId}.storage.used`
            );

            if (workspaceStorageUsed >= BigInt(workspace.storage_limit)) {
              throw {
                status_code: 400,
                body: JSON.stringify({
                  code: ApiErrorCode.WorkspaceStorageLimitExceeded,
                  message:
                    'The workspace has reached the maximum storage limit for this workspace.',
                }),
              };
            }
          }

          // create the upload record
          const createdUpload = await database
            .insertInto('uploads')
            .returningAll()
            .values({
              file_id: fileId,
              upload_id: generateId(IdType.Upload),
              workspace_id: workspaceId,
              root_id: file.rootId,
              mime_type: file.attributes.mimeType,
              size: file.attributes.size,
              path: path,
              version_id: file.attributes.version,
              created_at: new Date(),
              created_by: request.user.id,
            })
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
            throw {
              status_code: 500,
              body: JSON.stringify({
                code: ApiErrorCode.FileUploadCompleteFailed,
                message: 'Failed to complete file upload.',
              }),
            };
          }

          const tusInfoPath = `${path}.info`;
          await deleteFile(tusInfoPath);

          return {
            status_code: 204,
          };
        },
        generateUrl(_req, options) {
          return `${options.proto}://${options.host}/client/v1/workspaces/${workspaceId}/files/${fileId}`;
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
