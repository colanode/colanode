import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { useMemo } from 'react';

import { routeTree } from '@colanode/ui/routes';

export const LayoutMobile = () => {
  const router = useMemo(() => {
    return createRouter({
      routeTree,
      context: {},
      history: createMemoryHistory(),
      defaultPreload: 'intent',
      scrollRestoration: true,
      defaultStructuralSharing: true,
      defaultPreloadStaleTime: 0,
    });
  }, []);

  return <RouterProvider router={router} />;
};
