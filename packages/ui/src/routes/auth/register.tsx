import { createRoute } from '@tanstack/react-router';

import { Register } from '@colanode/ui/components/auth/register';
import { RegisterTab } from '@colanode/ui/components/auth/register-tab';
import { authRoute } from '@colanode/ui/routes/auth';

export const registerRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/register',
  component: Register,
  context: () => {
    return {
      tab: <RegisterTab />,
    };
  },
});
