import { FastifyPluginCallback } from 'fastify';

import { accountSyncRoute } from './account-sync';
import { emailLoginRoute } from './email-login';
import { loginWithGoogleRoute } from './login-google';
import { logoutRoute } from './logout';
import { emailRegisterRoute } from './email-register';
import { accountUpdateRoute } from './account-update';
import { emailVerifyRoute } from './email-verify';
import { emailPasswordResetInitRoute } from './email-password-reset-init';
import { emailPasswordResetCompleteRoute } from './email-password-reset-complete';

import { accountAuthenticator } from '@/api/client/plugins/account-auth';

export const accountRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(emailLoginRoute);
  instance.register(loginWithGoogleRoute);
  instance.register(emailRegisterRoute);
  instance.register(emailVerifyRoute);
  instance.register(emailPasswordResetInitRoute);
  instance.register(emailPasswordResetCompleteRoute);

  instance.register(async (subInstance) => {
    await subInstance.register(accountAuthenticator);

    await subInstance.register(accountSyncRoute);
    await subInstance.register(logoutRoute);
    await subInstance.register(accountUpdateRoute);
  });

  done();
};
