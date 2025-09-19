import { Outlet } from '@tanstack/react-router';

import { AccountProvider } from '@colanode/ui/components/accounts/account-provider';

export const RootLayout = () => {
  return (
    <div className="w-screen min-w-screen h-screen min-h-screen flex flex-row bg-background">
      <AccountProvider>
        <Outlet />
      </AccountProvider>
    </div>
  );
};
