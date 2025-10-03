import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { AppAppearanceSettingsScreen } from '@colanode/ui/components/app/app-appearance-settings-screen';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/account/workspace';
import { getAccountForWorkspace } from '@colanode/ui/routes/utils';

export const appAppearanceRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/app/appearance',
  component: AppAppearanceSettingsScreen,
});

export const appAppearanceMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/app/appearance',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = getAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/app/appearance',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});
