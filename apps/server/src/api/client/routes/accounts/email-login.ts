import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import {
  AccountStatus,
  emailLoginInputSchema,
  ApiErrorCode,
  apiErrorOutputSchema,
  loginOutputSchema,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import {
  buildLoginSuccessOutput,
  buildLoginVerifyOutput,
  verifyPassword,
} from '@colanode/server/lib/accounts';
import { config } from '@colanode/server/lib/config';
import { isAuthEmailRateLimited } from '@colanode/server/lib/rate-limits';

export const emailLoginRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/emails/login',
    schema: {
      body: emailLoginInputSchema,
      response: {
        200: loginOutputSchema,
        400: apiErrorOutputSchema,
        429: apiErrorOutputSchema,
        401: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const input = request.body;
      const email = input.email.toLowerCase();

      const isEmailRateLimited = await isAuthEmailRateLimited(email);
      if (isEmailRateLimited) {
        return reply.code(429).send({
          code: ApiErrorCode.TooManyRequests,
          message: 'Too many authentication attempts. Please try again later.',
        });
      }

      const account = await database
        .selectFrom('accounts')
        .where('email', '=', email)
        .selectAll()
        .executeTakeFirst();

      if (!account || !account.password) {
        return reply.code(400).send({
          code: ApiErrorCode.EmailOrPasswordIncorrect,
          message: 'Invalid email or password.',
        });
      }

      if (account.status === AccountStatus.Unverified) {
        if (config.account.verificationType === 'email') {
          const output = await buildLoginVerifyOutput(account);
          return output;
        }

        return reply.code(400).send({
          code: ApiErrorCode.AccountPendingVerification,
          message:
            'Account is not verified yet. Contact your administrator to verify your account.',
        });
      }

      const passwordMatch = await verifyPassword(
        input.password,
        account.password
      );

      if (!passwordMatch) {
        return reply.code(400).send({
          code: ApiErrorCode.EmailOrPasswordIncorrect,
          message: 'Invalid email or password.',
        });
      }

      const output = await buildLoginSuccessOutput(account, request.client);
      return output;
    },
  });

  done();
};
