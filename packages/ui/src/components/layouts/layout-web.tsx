import {
  createBrowserHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

import { GlobalCommandPalette } from '@colanode/ui/components/layouts/global-command-palette';
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

  const handleOpenInCurrentTab = useCallback(
    (location: string) => {
      router.history.push(location);
    },
    [router]
  );

  const handleOpenInNewTab = useCallback((location: string) => {
    window.open(location, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <GlobalCommandPalette
        openInCurrentTab={handleOpenInCurrentTab}
        openInNewTab={handleOpenInNewTab}
      />
    </>
  );
};
