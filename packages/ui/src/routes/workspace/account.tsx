import { createRoute, redirect } from '@tanstack/react-router';

import { AccountSettingsContainer } from '@colanode/ui/components/accounts/account-settings-container';
import { AccountSettingsTab } from '@colanode/ui/components/accounts/account-settings-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const accountSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/account',
  component: AccountSettingsContainer,
  context: () => {
    return {
      tab: <AccountSettingsTab />,
    };
  },
});

export const accountSettingsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/account',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/account',
        params: { userId },
        replace: true,
      });
    }
  },
});
