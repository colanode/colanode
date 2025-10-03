import { createRoute, redirect, notFound } from '@tanstack/react-router';

import { WorkspaceCreateScreen } from '@colanode/ui/components/workspaces/workspace-create-screen';
import { accountRoute } from '@colanode/ui/routes/account';
import { rootRoute } from '@colanode/ui/routes/root';
import { getDefaultAccount } from '@colanode/ui/routes/utils';

export const workspaceCreateRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/create',
  component: WorkspaceCreateScreen,
});

export const workspaceCreateMaskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: () => null,
  beforeLoad: () => {
    const account = getDefaultAccount();
    if (account) {
      throw redirect({
        to: '/acc/$accountId/create',
        params: { accountId: account.id },
        replace: true,
      });
    }

    throw notFound();
  },
});
