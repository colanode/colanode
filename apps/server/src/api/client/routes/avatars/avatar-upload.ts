import { PutObjectCommand } from '@aws-sdk/client-s3';
import fastifyMultipart from '@fastify/multipart';
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import sharp from 'sharp';

import {
  ApiErrorCode,
  apiErrorOutputSchema,
  avatarUploadOutputSchema,
  generateId,
  IdType,
} from '@colanode/core';
import { avatarS3 } from '@colanode/server/data/storage';
import { config } from '@colanode/server/lib/config';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const FILE_TYPES_REGEX = /jpeg|jpg|png|webp/;

export const avatarUploadRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

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
    handler: async (request, reply) => {
      try {
        let buffer: Buffer;
        const contentType = request.headers['content-type'] || '';

        if (ALLOWED_MIME_TYPES.includes(contentType)) {
          buffer = request.body as Buffer;
        } else if (contentType.startsWith('multipart/form-data')) {
          const file = await request.file();
          if (!file) {
            return reply.code(400).send({
              code: ApiErrorCode.AvatarFileNotUploaded,
              message: 'Avatar file not uploaded as part of request',
            });
          }

          const extname = FILE_TYPES_REGEX.test(file.filename.toLowerCase());
          const mimetype = FILE_TYPES_REGEX.test(file.mimetype);

          if (!mimetype || !extname) {
            return reply.code(400).send({
              code: ApiErrorCode.AvatarFileNotUploaded,
              message: 'Only images are allowed',
            });
          }

          buffer = await file.toBuffer();
        } else {
          return reply.code(400).send({
            code: ApiErrorCode.AvatarFileNotUploaded,
            message:
              'Invalid content type. Must be either multipart/form-data or a direct image upload',
          });
        }

        const jpegBuffer = await sharp(buffer)
          .resize({
            width: 500,
            height: 500,
            fit: 'inside',
          })
          .jpeg()
          .toBuffer();

        const avatarId = generateId(IdType.Avatar);
        const command = new PutObjectCommand({
          Bucket: config.avatarS3.bucketName,
          Key: `avatars/${avatarId}.jpeg`,
          Body: jpegBuffer,
          ContentType: 'image/jpeg',
        });

        await avatarS3.send(command);

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
