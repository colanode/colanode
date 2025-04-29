import { FastifyPluginCallback } from 'fastify';
import { AccountStatus, EmailLoginInput, ApiErrorCode } from '@colanode/core';

import { database } from '@/data/database';
import { rateLimitService } from '@/services/rate-limit-service';
import { configuration } from '@/lib/configuration';
import {
  buildLoginSuccessOutput,
  buildLoginVerifyOutput,
  verifyPassword,
} from '@/lib/accounts';

export const emailLoginRoute: FastifyPluginCallback = (instance, _, done) => {
  instance.post('/emails/login', async (request, reply) => {
    const ip = request.originalIp;
    const isIpRateLimited = await rateLimitService.isAuthIpRateLimitted(ip);
    if (isIpRateLimited) {
      return reply.code(429).send({
        code: ApiErrorCode.TooManyRequests,
        message: 'Too many authentication attempts. Please try again later.',
      });
    }

    const input = request.body as EmailLoginInput;
    const email = input.email.toLowerCase();

    const isEmailRateLimited =
      await rateLimitService.isAuthEmailRateLimitted(email);
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
      if (configuration.account.verificationType === 'email') {
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
  });

  done();
};
