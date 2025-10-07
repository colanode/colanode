import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import sharp from 'sharp';

import {
  ApiErrorCode,
  apiErrorOutputSchema,
  avatarUploadOutputSchema,
  generateId,
  IdType,
} from '@colanode/core';
import { storage } from '@colanode/server/lib/storage';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const avatarUploadRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.removeAllContentTypeParsers();

  ALLOWED_MIME_TYPES.forEach((mimeType) => {
    instance.addContentTypeParser(
      mimeType,
      { parseAs: 'buffer' },
      (_req, payload, done) => {
        done(null, payload);
      }
    );
  });

  instance.route({
    method: 'POST',
    url: '/',
    schema: {
      response: {
        200: avatarUploadOutputSchema,
        400: apiErrorOutputSchema,
        500: apiErrorOutputSchema,
      },
    },
    bodyLimit: 1024 * 1024 * 10, // 10MB
    handler: async (request, reply) => {
      try {
        const contentType = request.headers['content-type'] || '';

        if (!ALLOWED_MIME_TYPES.includes(contentType)) {
          return reply.code(400).send({
            code: ApiErrorCode.AvatarFileNotUploaded,
            message:
              'Invalid content type. Must be a direct image upload of type jpeg, jpg, png, or webp',
          });
        }

        const buffer = request.body as Buffer;
        const jpegBuffer = await sharp(buffer)
          .resize({
            width: 500,
            height: 500,
            fit: 'inside',
          })
          .jpeg()
          .toBuffer();

        const avatarId = generateId(IdType.Avatar);
        await storage.upload(`avatars/${avatarId}.jpeg`, jpegBuffer, 'image/jpeg');

        return { success: true, id: avatarId };
      } catch {
        return reply.code(500).send({
          code: ApiErrorCode.AvatarUploadFailed,
          message: 'Failed to upload avatar',
        });
      }
    },
  });

  done();
};
