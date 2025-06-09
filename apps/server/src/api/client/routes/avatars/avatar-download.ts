import { Readable } from 'stream';

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { ApiErrorCode } from '@colanode/core';
import { s3Client } from '@colanode/server/data/storage';
import { config } from '@colanode/server/lib/config';

export const avatarDownloadRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'GET',
    url: '/:avatarId',
    schema: {
      params: z.object({
        avatarId: z.string(),
      }),
    },
    handler: async (request, reply) => {
      try {
        const avatarId = request.params.avatarId;
        const command = new GetObjectCommand({
          Bucket: config.storage.bucketName,
          Key: `avatars/${avatarId}.jpeg`,
        });

        const avatarResponse = await s3Client.send(command);
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
    },
  });

  done();
};
