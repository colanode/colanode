import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { AccountSettingsScreen } from '@colanode/ui/components/accounts/account-settings-screen';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const accountSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account/settings',
  component: AccountSettingsScreen,
});

export const accountSettingsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/account/settings',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/account/settings',
        params: { userId },
        replace: true,
      });
    }

    throw notFound();
  },
});
