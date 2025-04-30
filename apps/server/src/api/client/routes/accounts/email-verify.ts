import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import {
  AccountStatus,
  ApiErrorCode,
  apiErrorOutputSchema,
  EmailVerifyInput,
  loginOutputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { buildLoginSuccessOutput, verifyOtpCode } from '@/lib/accounts';

export const emailVerifyRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/emails/verify',
    schema: {
      response: {
        200: loginOutputSchema,
        400: apiErrorOutputSchema,
        429: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const input = request.body as EmailVerifyInput;
      const accountId = await verifyOtpCode(input.id, input.otp);

      if (!accountId) {
        return reply.code(400).send({
          code: ApiErrorCode.AccountOtpInvalid,
          message:
            'Invalid or expired OTP code. Please request a new OTP code.',
        });
      }

      const account = await database
        .updateTable('accounts')
        .returningAll()
        .set({
          status: AccountStatus.Active,
        })
        .where('id', '=', accountId)
        .executeTakeFirst();

      if (!account) {
        return reply.code(404).send({
          code: ApiErrorCode.AccountNotFound,
          message: 'Account not found.',
        });
      }

      const output = await buildLoginSuccessOutput(account, {
        ip: request.originalIp,
        platform: input.platform,
        version: input.version,
      });

      return output;
    },
  });

  done();
};
