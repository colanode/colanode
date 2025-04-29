import { FastifyPluginCallback } from 'fastify';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { ApiErrorCode } from '@colanode/core';

import { Readable } from 'stream';

import { avatarS3 } from '@/data/storage';
import { configuration } from '@/lib/configuration';

interface AvatarDownloadParams {
  avatarId: string;
}

export const avatarDownloadRoute: FastifyPluginCallback = (
  instance,
  _,
  done
) => {
  instance.get<{ Params: AvatarDownloadParams }>(
    '/:avatarId',
    async (request, reply) => {
      try {
        const avatarId = request.params.avatarId;
        const command = new GetObjectCommand({
          Bucket: configuration.avatarS3.bucketName,
          Key: `avatars/${avatarId}.jpeg`,
        });

        const avatarResponse = await avatarS3.send(command);
        if (!avatarResponse.Body) {
          return reply.code(400).send({
            code: ApiErrorCode.AvatarNotFound,
            message: 'Avatar not found',
          });
        }

        if (avatarResponse.Body instanceof Readable) {
          reply.header('Content-Type', 'image/jpeg');
          return reply.send(avatarResponse.Body);
        }

        return reply.code(400).send({
          code: ApiErrorCode.AvatarNotFound,
          message: 'Avatar not found',
        });
      } catch {
        return reply.code(500).send({
          code: ApiErrorCode.AvatarDownloadFailed,
          message: 'Failed to download avatar',
        });
      }
    }
  );

  done();
};
