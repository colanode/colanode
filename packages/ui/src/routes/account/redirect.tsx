import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { accountRoute } from '@colanode/ui/routes/account';
import { useAppStore } from '@colanode/ui/stores/app';

export const accountRedirectRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const accountId = ctx.params.accountId;
    const state = useAppStore.getState();
    const account = state.accounts[accountId];
    if (!account) {
      throw notFound();
    }

    const workspaces = Object.values(account.workspaces);
    const lastUsedWorkspaceId = account.metadata.workspace;
    if (lastUsedWorkspaceId) {
      const lastUsedWorkspace = workspaces.find(
        (workspace) => workspace.id === lastUsedWorkspaceId
      );

      if (lastUsedWorkspace) {
        throw redirect({
          to: '/acc/$accountId/$workspaceId',
          params: {
            accountId: account.id,
            workspaceId: lastUsedWorkspace.id,
          },
          replace: true,
        });
      }
    }

    const defaultWorkspace = workspaces[0];
    if (defaultWorkspace) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId',
        params: { accountId: account.id, workspaceId: defaultWorkspace.id },
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
