import {
  createBrowserHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { useMemo } from 'react';

import { routeTree } from '@colanode/ui/routes';
import { routeMasks } from '@colanode/ui/routes/masks';

export const LayoutWeb = () => {
  const router = useMemo(() => {
    return createRouter({
      routeTree,
      routeMasks: routeMasks,
      context: {},
      history: createBrowserHistory(),
      defaultPreload: 'intent',
      scrollRestoration: true,
      defaultStructuralSharing: true,
      defaultPreloadStaleTime: 0,
    });
  }, []);

  return <RouterProvider router={router} />;
};
