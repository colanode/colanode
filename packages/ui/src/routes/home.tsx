import { createRoute, redirect } from '@tanstack/react-router';

import { rootRoute } from '@colanode/ui/routes/root';
import { getDefaultAccount } from '@colanode/ui/routes/utils';

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null,
  beforeLoad: () => {
    const defaultAccount = getDefaultAccount();
    if (defaultAccount) {
      throw redirect({
        to: '/acc/$accountId',
        params: { accountId: defaultAccount.id },
        replace: true,
      });
    }

    throw redirect({ to: '/login', replace: true });
  },
});
