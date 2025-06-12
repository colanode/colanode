import { PutObjectCommand } from '@aws-sdk/client-s3';
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import ky from 'ky';
import sharp from 'sharp';

import {
  AccountStatus,
  generateId,
  IdType,
  ApiErrorCode,
  apiErrorOutputSchema,
  loginOutputSchema,
  googleLoginInputSchema,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { UpdateAccount } from '@colanode/server/data/schema';
import { s3Client } from '@colanode/server/data/storage';
import {
  buildLoginSuccessOutput,
  buildLoginVerifyOutput,
} from '@colanode/server/lib/accounts';
import { config } from '@colanode/server/lib/config';
import { AccountAttributes } from '@colanode/server/types/accounts';

const GoogleUserInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';
const GoogleTokenUrl = 'https://oauth2.googleapis.com/token';

// While implementing this I was getting significant latencies from Google responses
// and I thought that was normal, therefore I set the timeout to 10 seconds.
// Later that day, I realized that Google was experiencing a large outage (https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW)
// and now I decided to keep it at 10 seconds as a memory.
const GoogleRequestTimeout = 1000 * 10;

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
  refresh_token?: string;
}

interface GoogleUserResponse {
  id: string;
  email: string;
  name: string;
  verified_email: boolean;
  picture?: string | null;
}

const fetchGoogleToken = async (
  code: string,
  clientId: string,
  clientSecret: string
): Promise<GoogleTokenResponse | null> => {
  try {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'postmessage',
      grant_type: 'authorization_code',
    });

    const token = await ky
      .post(GoogleTokenUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
        timeout: GoogleRequestTimeout,
      })
      .json<GoogleTokenResponse>();

    return token;
  } catch {
    return null;
  }
};

const fetchGoogleUser = async (
  accessToken: string
): Promise<GoogleUserResponse | null> => {
  try {
    const user = await ky
      .get(GoogleUserInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: GoogleRequestTimeout,
      })
      .json<GoogleUserResponse>();

    return user;
  } catch {
    return null;
  }
};

const uploadGooglePictureAsAvatar = async (
  pictureUrl: string
): Promise<string | null> => {
  try {
    const arrayBuffer = await ky
      .get(pictureUrl, { timeout: GoogleRequestTimeout })
      .arrayBuffer();

    const originalBuffer = Buffer.from(arrayBuffer);

    const jpegBuffer = await sharp(originalBuffer)
      .resize({ width: 500, height: 500, fit: 'inside' })
      .jpeg()
      .toBuffer();

    const avatarId = generateId(IdType.Avatar);
    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: `avatars/${avatarId}.jpeg`,
      Body: jpegBuffer,
      ContentType: 'image/jpeg',
    });

    await s3Client.send(command);

    return avatarId;
  } catch {
    return null;
  }
};

export const googleLoginRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/google/login',
    schema: {
      body: googleLoginInputSchema,
      response: {
        200: loginOutputSchema,
        400: apiErrorOutputSchema,
        429: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      if (!config.account.google.enabled) {
        return reply.code(400).send({
          code: ApiErrorCode.GoogleAuthFailed,
          message: 'Google login is not allowed.',
        });
      }

      const input = request.body;

      const token = await fetchGoogleToken(
        input.code,
        config.account.google.clientId,
        config.account.google.clientSecret
      );

      if (!token?.access_token) {
        return reply.code(400).send({
          code: ApiErrorCode.GoogleAuthFailed,
          message: 'Google access token not found.',
        });
      }

      const googleUser = await fetchGoogleUser(token.access_token);
      if (!googleUser) {
        return reply.code(400).send({
          code: ApiErrorCode.GoogleAuthFailed,
          message: 'Failed to authenticate with Google.',
        });
      }

      let existingAccount = await database
        .selectFrom('accounts')
        .where('email', '=', googleUser.email)
        .selectAll()
        .executeTakeFirst();

      if (existingAccount) {
        const existingGoogleId = existingAccount.attributes?.googleId;
        if (existingGoogleId && existingGoogleId !== googleUser.id) {
          return reply.code(400).send({
            code: ApiErrorCode.GoogleAuthFailed,
            message: 'Google account already exists.',
          });
        }

        const updateAccount: UpdateAccount = {};

        if (existingGoogleId !== googleUser.id) {
          const newAttributes: AccountAttributes = {
            ...existingAccount.attributes,
            googleId: googleUser.id,
          };

          updateAccount.attributes = JSON.stringify(newAttributes);
        }

        if (
          existingAccount.status !== AccountStatus.Active &&
          googleUser.verified_email
        ) {
          updateAccount.status = AccountStatus.Active;
        }

        if (!existingAccount.avatar && googleUser.picture) {
          updateAccount.avatar = await uploadGooglePictureAsAvatar(
            googleUser.picture
          );
        }

        if (Object.keys(updateAccount).length > 0) {
          updateAccount.updated_at = new Date();
          existingAccount = await database
            .updateTable('accounts')
            .returningAll()
            .set(updateAccount)
            .where('id', '=', existingAccount.id)
            .executeTakeFirst();
        }

        if (!existingAccount) {
          return reply.code(400).send({
            code: ApiErrorCode.GoogleAuthFailed,
            message: 'Google account not found.',
          });
        }

        const output = await buildLoginSuccessOutput(
          existingAccount,
          request.client
        );

        return output;
      }

      let avatar: string | null = null;
      if (googleUser.picture) {
        avatar = await uploadGooglePictureAsAvatar(googleUser.picture);
      }

      let status = AccountStatus.Unverified;
      if (googleUser.verified_email) {
        status = AccountStatus.Active;
      } else if (config.account.verificationType === 'automatic') {
        status = AccountStatus.Active;
      }

      const newAccount = await database
        .insertInto('accounts')
        .values({
          id: generateId(IdType.Account),
          name: googleUser.name,
          email: googleUser.email,
          avatar,
          status,
          created_at: new Date(),
          password: null,
          attributes: JSON.stringify({ googleId: googleUser.id }),
        })
        .returningAll()
        .executeTakeFirst();

      if (!newAccount) {
        return reply.code(400).send({
          code: ApiErrorCode.AccountCreationFailed,
          message: 'Failed to create account.',
        });
      }

      if (newAccount.status === AccountStatus.Unverified) {
        if (config.account.verificationType === 'email') {
          const output = await buildLoginVerifyOutput(newAccount);
          return output;
        }

        return reply.code(400).send({
          code: ApiErrorCode.AccountPendingVerification,
          message:
            'Account is not verified yet. Contact your administrator to verify your account.',
        });
      }

      const output = await buildLoginSuccessOutput(newAccount, request.client);
      return output;
    },
  });

  done();
};
