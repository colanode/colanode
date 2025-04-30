import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import {
  generateId,
  IdType,
  ApiErrorCode,
  EmailPasswordResetInitInput,
  EmailPasswordResetInitOutput,
  apiErrorOutputSchema,
  emailPasswordResetInitOutputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { rateLimitService } from '@/services/rate-limit-service';
import { configuration } from '@/lib/configuration';
import { generateOtpCode, saveOtp } from '@/lib/otps';
import { AccountPasswordResetOtpAttributes, Otp } from '@/types/otps';
import { jobService } from '@/services/job-service';

export const emailPasswordResetInitRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/emails/passwords/reset/init',
    schema: {
      response: {
        200: emailPasswordResetInitOutputSchema,
        400: apiErrorOutputSchema,
        429: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const ip = request.originalIp;
      const isIpRateLimited = await rateLimitService.isAuthIpRateLimitted(ip);
      if (isIpRateLimited) {
        return reply.code(429).send({
          code: ApiErrorCode.TooManyRequests,
          message: 'Too many authentication attempts. Please try again later.',
        });
      }

      const input = request.body as EmailPasswordResetInitInput;
      const email = input.email.toLowerCase();

      const isEmailRateLimited =
        await rateLimitService.isAuthEmailRateLimitted(email);
      if (isEmailRateLimited) {
        return reply.code(429).send({
          code: ApiErrorCode.TooManyRequests,
          message: 'Too many authentication attempts. Please try again later.',
        });
      }

      const id = generateId(IdType.OtpCode);
      const expiresAt = new Date(
        Date.now() + configuration.account.otpTimeout * 1000
      );
      const otpCode = await generateOtpCode();

      const account = await database
        .selectFrom('accounts')
        .selectAll()
        .where('email', '=', email)
        .executeTakeFirst();

      if (!account) {
        const output: EmailPasswordResetInitOutput = {
          id,
          expiresAt,
        };
        return output;
      }

      const otp: Otp<AccountPasswordResetOtpAttributes> = {
        id,
        expiresAt,
        otp: otpCode,
        attributes: {
          accountId: account.id,
          attempts: 0,
        },
      };

      await saveOtp(id, otp);
      await jobService.addJob({
        type: 'send_email_password_reset_email',
        otpId: id,
      });

      const output: EmailPasswordResetInitOutput = {
        id,
        expiresAt,
      };

      return output;
    },
  });

  done();
};
