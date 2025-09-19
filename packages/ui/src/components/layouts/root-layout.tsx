import { Outlet } from '@tanstack/react-router';

import { AccountProvider } from '@colanode/ui/components/accounts/account-provider';

export const RootLayout = () => {
  return (
    <AccountProvider>
      <Outlet />
    </AccountProvider>
  );
};
