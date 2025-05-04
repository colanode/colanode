import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import {
  AccountStatus,
  emailLoginInputSchema,
  ApiErrorCode,
  apiErrorOutputSchema,
  loginOutputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { isAuthEmailRateLimited } from '@/lib/rate-limits';
import { config } from '@/lib/config';
import {
  buildLoginSuccessOutput,
  buildLoginVerifyOutput,
  verifyPassword,
} from '@/lib/accounts';

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

      const output = await buildLoginSuccessOutput(account, {
        ip: request.ip,
        platform: input.platform,
        version: input.version,
      });

      return output;
    },
  });

  done();
};
