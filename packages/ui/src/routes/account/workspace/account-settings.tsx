import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { AccountSettingsScreen } from '@colanode/ui/components/accounts/account-settings-screen';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/account/workspace';
import { getAccountForWorkspace } from '@colanode/ui/routes/utils';

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
    const account = getAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/account/settings',
        params: { accountId: account, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});
