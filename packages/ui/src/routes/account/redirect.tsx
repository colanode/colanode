import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { database } from '@colanode/ui/data';
import { accountRoute } from '@colanode/ui/routes/account';

export const accountRedirectRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const accountId = ctx.params.accountId;
    const account = database.accounts.get(accountId);
    if (!account) {
      throw notFound();
    }

    const workspaceIds = database
      .accountWorkspaces(accountId)
      .map((workspace) => workspace.id);

    const lastUsedWorkspaceId = database
      .accountMetadata(accountId)
      .get('workspace')?.value as string | undefined;

    if (lastUsedWorkspaceId && workspaceIds.includes(lastUsedWorkspaceId)) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId',
        params: {
          accountId: account.id,
          workspaceId: lastUsedWorkspaceId,
        },
        replace: true,
      });
    }

    const defaultWorkspace = workspaceIds[0];
    if (defaultWorkspace) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId',
        params: { accountId: account.id, workspaceId: defaultWorkspace },
        replace: true,
      });
    }

    throw redirect({
      to: '/acc/$accountId/create',
      params: { accountId: account.id },
      replace: true,
    });
  },
});
