import { Outlet, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

import { ServerProvider } from '@colanode/ui/components/servers/server-provider';
import { AccountContext } from '@colanode/ui/contexts/account';
import { useAppStore } from '@colanode/ui/stores/app';

export const AccountScreen = () => {
  const { accountId } = useParams({ from: '/acc/$accountId' });
  const accountServer = useAppStore(
    (state) => state.accounts[accountId]?.server
  );

  useEffect(() => {
    useAppStore.getState().updateAppMetadata({
      key: 'account',
      value: accountId,
    });

    window.colanode.executeMutation({
      type: 'app.metadata.update',
      key: 'account',
      value: accountId,
    });
  }, [accountId]);

  if (!accountServer) {
    return <p>Account not found</p>;
  }

  return (
    <ServerProvider domain={accountServer}>
      <AccountContext.Provider value={{ id: accountId }}>
        <Outlet />
      </AccountContext.Provider>
    </ServerProvider>
  );
};
