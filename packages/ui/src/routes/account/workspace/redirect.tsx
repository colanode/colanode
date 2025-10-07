import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { database } from '@colanode/ui/data';
import {
  workspaceMaskRoute,
  workspaceRoute,
} from '@colanode/ui/routes/account/workspace';
import { getAccountForWorkspace } from '@colanode/ui/routes/utils';

export const workspaceRedirectRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const accountId = ctx.params.accountId;
    const workspaceId = ctx.params.workspaceId;
    const workspace = database.accountWorkspaces(accountId).get(workspaceId);

    if (!workspace) {
      throw notFound();
    }

    const lastLocation = database
      .workspaceMetadata(accountId, workspaceId)
      .get('location')?.value as string | undefined;

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
        params: { accountId: account, workspaceId: ctx.params.workspaceId },
        replace: true,
      });
    }

    throw notFound();
  },
});
