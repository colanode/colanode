import {
  createBrowserHistory,
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { useMemo } from 'react';

import { useApp } from '@colanode/ui/contexts/app';
import { routeMasks, routeTree } from '@colanode/ui/router';

export const AppLayoutSingle = () => {
  const app = useApp();

  const router = useMemo(() => {
    const history =
      app.type === 'web' ? createBrowserHistory() : createMemoryHistory();

    return createRouter({
      routeTree,
      routeMasks: app.type === 'web' ? routeMasks : [],
      context: {},
      history,
      defaultPreload: 'intent',
      scrollRestoration: true,
      defaultStructuralSharing: true,
      defaultPreloadStaleTime: 0,
    });
  }, []);

  return <RouterProvider router={router} />;
};
