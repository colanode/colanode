import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { WorkspaceSettingsScreen } from '@colanode/ui/components/workspaces/workspace-settings-screen';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/account/workspace';
import { getAccountForWorkspace } from '@colanode/ui/routes/utils';

export const workspaceSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/settings',
  component: WorkspaceSettingsScreen,
});

export const workspaceSettingsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/settings',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = getAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/settings',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});
