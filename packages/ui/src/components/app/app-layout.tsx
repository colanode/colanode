import { createRouter, RouterProvider } from '@tanstack/react-router';
import { useMemo } from 'react';

import { routeTree } from '@colanode/ui/router';

export const AppLayout = () => {
  const router = useMemo(
    () =>
      createRouter({
        routeTree,
        context: {},
        defaultPreload: 'intent',
        scrollRestoration: true,
        defaultStructuralSharing: true,
        defaultPreloadStaleTime: 0,
      }),
    []
  );

  return <RouterProvider router={router} />;
};
