import { createRoute, notFound, redirect } from '@tanstack/react-router';

import {
  workspaceMaskRoute,
  workspaceRoute,
} from '@colanode/ui/routes/account/workspace';
import { getAccountForWorkspace } from '@colanode/ui/routes/utils';
import { useAppStore } from '@colanode/ui/stores/app';

export const workspaceRedirectRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const accountId = ctx.params.accountId;
    const workspaceId = ctx.params.workspaceId;
    const workspace =
      useAppStore.getState().accounts[accountId]?.workspaces[workspaceId];

    if (!workspace) {
      throw notFound();
    }

    const lastLocation = workspace.metadata.location;
    if (lastLocation) {
      throw redirect({ to: lastLocation, replace: true });
    }

    throw redirect({
      from: '/acc/$accountId/$workspaceId',
      to: 'home',
      replace: true,
    });
  },
});

export const workspaceRedirectMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = getAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/home',
        params: { accountId: account.id, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});
