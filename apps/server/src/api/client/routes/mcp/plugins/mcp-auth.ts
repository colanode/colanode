import { FastifyInstance, FastifyRequest } from 'fastify';
import { ApiErrorCode } from '@colanode/core';
import { isDeviceApiRateLimited } from '@colanode/server/lib/rate-limits';
import { parseToken, verifyToken } from '@colanode/server/lib/tokens';
import { RequestAccount } from '@colanode/server/types/api';

export interface McpContext {
  fastify: FastifyInstance;
  request?: FastifyRequest;
  extra?: any;
}

export async function authenticateMcpRequest(context: McpContext): Promise<RequestAccount> {
  const { request } = context;
  
  if (!request) {
    throw new Error('No request context available for authentication');
  }
  
  // Extract authorization header
  const auth = request.headers.authorization;
  if (!auth) {
    throw new Error('No authorization token provided');
  }

  const parts = auth.split(' ');
  const token = parts.length === 2 ? parts[1] : parts[0];

  if (!token) {
    throw new Error('No authorization token provided');
  }

  // Parse and validate token
  const tokenData = parseToken(token);
  if (!tokenData) {
    throw new Error('Token is invalid or expired');
  }

  // Check rate limiting
  const isRateLimited = await isDeviceApiRateLimited(tokenData.deviceId);
  if (isRateLimited) {
    throw new Error('Too many requests from this device. Please try again later.');
  }

  // Verify token and get account
  const result = await verifyToken(tokenData);
  if (!result.authenticated) {
    throw new Error('Token is invalid or expired');
  }

  return result.account;
}