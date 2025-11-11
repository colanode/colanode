import { createRoute, redirect } from '@tanstack/react-router';

import { AccountLogoutBreadcrumb } from '@colanode/ui/components/accounts/account-logout-breadcrumb';
import { AccountLogoutScreen } from '@colanode/ui/components/accounts/account-logout-screen';
import { AccountLogoutTab } from '@colanode/ui/components/accounts/account-logout-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const accountLogoutRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/logout',
  component: AccountLogoutScreen,
  context: () => {
    return {
      tab: <AccountLogoutTab />,
      breadcrumb: <AccountLogoutBreadcrumb />,
    };
  },
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
  },
});
