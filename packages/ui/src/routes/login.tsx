import { createRoute } from '@tanstack/react-router';

import { Login } from '@colanode/ui/components/accounts/login';
import { LoginTab } from '@colanode/ui/components/accounts/login-tab';
import { rootRoute } from '@colanode/ui/routes/root';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
  context: () => {
    return {
      tab: <LoginTab />,
    };
  },
});
