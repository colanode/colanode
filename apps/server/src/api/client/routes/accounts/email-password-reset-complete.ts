import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import {
  AccountStatus,
  ApiErrorCode,
  apiErrorOutputSchema,
  emailPasswordResetCompleteInputSchema,
  EmailPasswordResetCompleteOutput,
  emailPasswordResetCompleteOutputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { generatePasswordHash, verifyOtpCode } from '@/lib/accounts';

export const emailPasswordResetCompleteRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/emails/passwords/reset/complete',
    schema: {
      body: emailPasswordResetCompleteInputSchema,
      response: {
        200: emailPasswordResetCompleteOutputSchema,
        400: apiErrorOutputSchema,
        401: apiErrorOutputSchema,
        429: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const input = request.body;
      const accountId = await verifyOtpCode(input.id, input.otp);

      if (!accountId) {
        return reply.code(400).send({
          code: ApiErrorCode.AccountOtpInvalid,
          message: 'Invalid or expired code. Please request a new code.',
        });
      }

      const account = await database
        .selectFrom('accounts')
        .selectAll()
        .where('id', '=', accountId)
        .executeTakeFirst();

      if (!account) {
        return reply.code(400).send({
          code: ApiErrorCode.AccountOtpInvalid,
          message: 'Invalid or expired code. Please request a new code.',
        });
      }

      const password = await generatePasswordHash(input.password);
      const updatedAccount = await database
        .updateTable('accounts')
        .returningAll()
        .set({
          password,
          status: AccountStatus.Active,
          updated_at: new Date(),
        })
        .where('id', '=', accountId)
        .executeTakeFirst();

      if (!updatedAccount) {
        return reply.code(400).send({
          code: ApiErrorCode.AccountOtpInvalid,
          message: 'Invalid or expired code. Please request a new code.',
        });
      }

      // automatically logout all devices
      await database
        .deleteFrom('devices')
        .where('account_id', '=', accountId)
        .execute();

      const output: EmailPasswordResetCompleteOutput = {
        success: true,
      };

      return output;
    },
  });

  done();
};
