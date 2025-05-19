import { FastifyPluginCallback } from 'fastify';

import { accountAuthenticator } from '@colanode/server/api/client/plugins/account-auth';
import { authIpRateLimiter } from '@colanode/server/api/client/plugins/auth-ip-rate-limit';

import { accountSyncRoute } from './account-sync';
import { accountUpdateRoute } from './account-update';
import { emailLoginRoute } from './email-login';
import { emailPasswordResetCompleteRoute } from './email-password-reset-complete';
import { emailPasswordResetInitRoute } from './email-password-reset-init';
import { emailRegisterRoute } from './email-register';
import { emailVerifyRoute } from './email-verify';
import { googleLoginRoute } from './google-login';
import { logoutRoute } from './logout';

export const accountRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register((subInstance) => {
    subInstance.register(authIpRateLimiter);

    subInstance.register(emailLoginRoute);
    subInstance.register(emailRegisterRoute);
    subInstance.register(emailVerifyRoute);
    subInstance.register(emailPasswordResetInitRoute);
    subInstance.register(emailPasswordResetCompleteRoute);
    subInstance.register(googleLoginRoute);
  });

  instance.register((subInstance) => {
    subInstance.register(accountAuthenticator);

    subInstance.register(accountSyncRoute);
    subInstance.register(accountUpdateRoute);
    subInstance.register(logoutRoute);
  });

  done();
};
