import { createRoute } from '@tanstack/react-router';

import { LoginScreen } from '@colanode/ui/components/accounts/login-screen';
import { LoginTab } from '@colanode/ui/components/accounts/login-tab';
import { rootRoute } from '@colanode/ui/routes/root';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
  context: () => {
    return {
      tab: <LoginTab />,
    };
  },
});
