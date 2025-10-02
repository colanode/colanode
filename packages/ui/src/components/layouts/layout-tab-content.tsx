import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { useMemo } from 'react';

import { routeTree } from '@colanode/ui/router';

interface LayoutTabContentProps {
  location: string;
  onChange: (location: string) => void;
}

export const LayoutTabContent = ({
  location,
  onChange,
}: LayoutTabContentProps) => {
  const router = useMemo(() => {
    const history = createMemoryHistory({
      initialEntries: [location],
    });

    const router = createRouter({
      routeTree,
      context: {},
      history,
      defaultPreload: 'intent',
      scrollRestoration: true,
      defaultStructuralSharing: true,
      defaultPreloadStaleTime: 0,
    });

    router.subscribe('onRendered', (event) => {
      if (!event.hrefChanged) {
        return;
      }

      onChange(event.toLocation.href);
    });

    return router;
  }, []);

  return <RouterProvider router={router} />;
};
