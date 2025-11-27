import { createRoute } from '@tanstack/react-router';

import { AuthLayout } from '@colanode/ui/components/auth/auth-layout';
import { rootRoute } from '@colanode/ui/routes/root';

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthLayout,
});
