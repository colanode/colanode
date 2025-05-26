import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import ky from 'ky';

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
import { database } from '@colanode/server/data/database';
import { buildLoginSuccessOutput } from '@colanode/server/lib/accounts';
import { config } from '@colanode/server/lib/config';

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
      const response = await ky.get(url).json<GoogleUserInfo>();

      if (!response) {
        return reply.code(400).send({
          code: ApiErrorCode.GoogleAuthFailed,
          message: 'Failed to authenticate with Google.',
        });
      }

      const existingAccount = await database
        .selectFrom('accounts')
        .where('email', '=', response.email)
        .selectAll()
        .executeTakeFirst();

      if (existingAccount) {
        if (existingAccount.status !== AccountStatus.Active) {
          await database
            .updateTable('accounts')
            .set({
              attrs: JSON.stringify({ googleId: response.id }),
              updated_at: new Date(),
              status: AccountStatus.Active,
            })
            .where('id', '=', existingAccount.id)
            .execute();
        }

        const output = await buildLoginSuccessOutput(
          existingAccount,
          request.client
        );
        return output;
      }

      const newAccount = await database
        .insertInto('accounts')
        .values({
          id: generateId(IdType.Account),
          name: response.name,
          email: response.email,
          status: AccountStatus.Active,
          created_at: new Date(),
          password: null,
          attrs: JSON.stringify({ googleId: response.id }),
        })
        .returningAll()
        .executeTakeFirst();

      if (!newAccount) {
        return reply.code(400).send({
          code: ApiErrorCode.AccountCreationFailed,
          message: 'Failed to create account.',
        });
      }

      const output = await buildLoginSuccessOutput(newAccount, request.client);
      return output;
    },
  });

  done();
};
