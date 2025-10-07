import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { AccountLogoutScreen } from '@colanode/ui/components/accounts/account-logout-screen';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/account/workspace';
import { getAccountForWorkspace } from '@colanode/ui/routes/utils';

export const accountLogoutRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/logout',
  component: AccountLogoutScreen,
});

export const accountLogoutMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/account/logout',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = getAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/account/logout',
        params: { accountId: account, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});
