import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { ApiErrorCode } from '@colanode/core';
import { isDeviceApiRateLimited } from '@colanode/server/lib/rate-limits';
import { parseToken, verifyToken } from '@colanode/server/lib/tokens';
import { RequestAccount } from '@colanode/server/types/api';

declare module 'fastify' {
  interface FastifyRequest {
    account: RequestAccount;
  }
}

const accountAuthenticatorCallback: FastifyPluginCallback = (
  fastify,
  _,
  done
) => {
  if (!fastify.hasRequestDecorator('account')) {
    fastify.decorateRequest('account');
  }

  fastify.addHook('onRequest', async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth) {
      return reply.code(401).send({
        code: ApiErrorCode.TokenMissing,
        message: 'No token provided',
      });
    }

    const parts = auth.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (!token) {
      return reply.code(401).send({
        code: ApiErrorCode.TokenMissing,
        message: 'No token provided',
      });
    }

    const tokenData = parseToken(token);
    if (!tokenData) {
      return reply.code(401).send({
        code: ApiErrorCode.TokenInvalid,
        message: 'Token is invalid or expired',
      });
    }

    const isRateLimited = await isDeviceApiRateLimited(tokenData.deviceId);

    if (isRateLimited) {
      return reply.code(429).send({
        code: ApiErrorCode.TooManyRequests,
        message: 'Too many requests from this device. Please try again later.',
      });
    }

    const result = await verifyToken(tokenData);
    if (!result.authenticated) {
      return reply.code(401).send({
        code: ApiErrorCode.TokenInvalid,
        message: 'Token is invalid or expired',
      });
    }

    request.account = result.account;
  });

  done();
};

export const accountAuthenticator = fp(accountAuthenticatorCallback);
