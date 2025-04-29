import { FastifyPluginCallback } from 'fastify';
import {
  CreateDownloadOutput,
  hasNodeRole,
  ApiErrorCode,
  extractNodeRole,
  FileStatus,
} from '@colanode/core';

import { fetchNodeTree, mapNode } from '@/lib/nodes';
import { database } from '@/data/database';
import { buildDownloadUrl } from '@/lib/files';

interface FileDownloadParams {
  fileId: string;
}

export const fileDownloadGetRoute: FastifyPluginCallback = (
  instance,
  _,
  done
) => {
  instance.get<{ Params: FileDownloadParams }>(
    '/:fileId',
    async (request, reply) => {
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

      const role = extractNodeRole(nodes, request.account.id);
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
    }
  );

  done();
};
