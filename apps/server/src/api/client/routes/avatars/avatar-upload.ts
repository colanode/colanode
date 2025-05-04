import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import sharp from 'sharp';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  ApiErrorCode,
  apiErrorOutputSchema,
  avatarUploadOutputSchema,
  generateId,
  IdType,
} from '@colanode/core';

import { avatarS3 } from '@/data/storage';
import { config } from '@/lib/config';

export const avatarUploadRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
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
        const file = await request.file();
        if (!file) {
          return reply.code(400).send({
            code: ApiErrorCode.AvatarFileNotUploaded,
            message: 'Avatar file not uploaded as part of request',
          });
        }

        // Validate file type
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(file.filename.toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (!mimetype || !extname) {
          return reply.code(400).send({
            code: ApiErrorCode.AvatarFileNotUploaded,
            message: 'Only images are allowed',
          });
        }

        // Read the file buffer
        const buffer = await file.toBuffer();

        // Resize image to a maximum of 500x500 pixels while keeping aspect ratio, and convert to JPEG using Sharp
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
