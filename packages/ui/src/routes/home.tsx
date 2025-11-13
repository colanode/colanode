import { createRoute, redirect } from '@tanstack/react-router';

import { rootRoute } from '@colanode/ui/routes/root';
import { getDefaultWorkspaceUserId } from '@colanode/ui/routes/utils';

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null,
  beforeLoad: () => {
    const defaultWorkspaceUserId = getDefaultWorkspaceUserId();
    if (defaultWorkspaceUserId) {
      throw redirect({
        to: '/workspace/$userId',
        params: { userId: defaultWorkspaceUserId },
        replace: true,
      });
    }

    throw redirect({ to: '/auth/login', replace: true });
  },
});
