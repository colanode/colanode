import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { AccountLogoutScreen } from '@colanode/ui/components/accounts/account-logout-screen';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

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
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/account/logout',
        params: { userId },
        replace: true,
      });
    }

    throw notFound();
  },
});
