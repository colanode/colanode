import { createRoute } from '@tanstack/react-router';

import { Login } from '@colanode/ui/components/auth/login';
import { LoginTab } from '@colanode/ui/components/auth/login-tab';
import { authRoute } from '@colanode/ui/routes/auth';

export const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/login',
  component: Login,
  context: () => {
    return {
      tab: <LoginTab />,
    };
  },
});
