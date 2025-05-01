import { FastifyPluginCallback } from 'fastify';

import { accountSyncRoute } from './account-sync';
import { emailLoginRoute } from './email-login';
import { logoutRoute } from './logout';
import { emailRegisterRoute } from './email-register';
import { accountUpdateRoute } from './account-update';
import { emailVerifyRoute } from './email-verify';
import { emailPasswordResetInitRoute } from './email-password-reset-init';
import { emailPasswordResetCompleteRoute } from './email-password-reset-complete';
import { googleLoginRoute } from './google-login';

import { accountAuthenticator } from '@/api/client/plugins/account-auth';
import { authIpRateLimiter } from '@/api/client/plugins/auth-ip-rate-limit';

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
