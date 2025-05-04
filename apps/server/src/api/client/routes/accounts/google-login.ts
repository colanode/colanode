import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import {
  AccountStatus,
  generateId,
  GoogleUserInfo,
  IdType,
  ApiErrorCode,
  apiErrorOutputSchema,
  loginOutputSchema,
  googleLoginInputSchema,
} from '@colanode/core';
import axios from 'axios';

import { database } from '@/data/database';
import { config } from '@/lib/config';
import { buildLoginSuccessOutput } from '@/lib/accounts';

const GoogleUserInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';

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
      if (!config.account.allowGoogleLogin) {
        return reply.code(400).send({
          code: ApiErrorCode.GoogleAuthFailed,
          message: 'Google login is not allowed.',
        });
      }

      const input = request.body;
      const url = `${GoogleUserInfoUrl}?access_token=${input.access_token}`;
      const userInfoResponse = await axios.get(url);

      if (userInfoResponse.status !== 200) {
        return reply.code(400).send({
          code: ApiErrorCode.GoogleAuthFailed,
          message: 'Failed to authenticate with Google.',
        });
      }

      const googleUser: GoogleUserInfo = userInfoResponse.data;

      if (!googleUser) {
        return reply.code(400).send({
          code: ApiErrorCode.GoogleAuthFailed,
          message: 'Failed to authenticate with Google.',
        });
      }

      const existingAccount = await database
        .selectFrom('accounts')
        .where('email', '=', googleUser.email)
        .selectAll()
        .executeTakeFirst();

      if (existingAccount) {
        if (existingAccount.status !== AccountStatus.Active) {
          await database
            .updateTable('accounts')
            .set({
              attrs: JSON.stringify({ googleId: googleUser.id }),
              updated_at: new Date(),
              status: AccountStatus.Active,
            })
            .where('id', '=', existingAccount.id)
            .execute();
        }

        const output = await buildLoginSuccessOutput(existingAccount, {
          ip: request.client.ip,
          platform: input.platform,
          version: input.version,
        });
        return output;
      }

      const newAccount = await database
        .insertInto('accounts')
        .values({
          id: generateId(IdType.Account),
          name: googleUser.name,
          email: googleUser.email,
          status: AccountStatus.Active,
          created_at: new Date(),
          password: null,
          attrs: JSON.stringify({ googleId: googleUser.id }),
        })
        .returningAll()
        .executeTakeFirst();

      if (!newAccount) {
        return reply.code(400).send({
          code: ApiErrorCode.AccountCreationFailed,
          message: 'Failed to create account.',
        });
      }

      const output = await buildLoginSuccessOutput(newAccount, {
        ip: request.client.ip,
        platform: input.platform,
        version: input.version,
      });

      return output;
    },
  });

  done();
};
