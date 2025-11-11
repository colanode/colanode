import { createRoute, redirect } from '@tanstack/react-router';

import { AccountLogoutContainer } from '@colanode/ui/components/accounts/account-logout-container';
import { AccountLogoutHeader } from '@colanode/ui/components/accounts/account-logout-header';
import { AccountLogoutTab } from '@colanode/ui/components/accounts/account-logout-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const accountLogoutRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/logout',
  component: AccountLogoutContainer,
  context: () => {
    return {
      tab: <AccountLogoutTab />,
      header: <AccountLogoutHeader />,
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
