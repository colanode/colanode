import { createRoute } from '@tanstack/react-router';

import { AccountScreen } from '@colanode/ui/components/accounts/account-screen';
import { rootRoute } from '@colanode/ui/routes/root';

export const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/acc/$accountId',
  component: AccountScreen,
});
