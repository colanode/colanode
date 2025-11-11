import { createRootRoute } from '@tanstack/react-router';

import { AppNotFound } from '@colanode/ui/components/app/app-not-found';

export const rootRoute = createRootRoute({
  notFoundComponent: AppNotFound,
});
