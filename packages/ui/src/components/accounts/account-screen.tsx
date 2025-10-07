import { eq, useLiveQuery } from '@tanstack/react-db';
import { Outlet, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

import { ServerProvider } from '@colanode/ui/components/servers/server-provider';
import { AccountContext } from '@colanode/ui/contexts/account';
import { database } from '@colanode/ui/data';

export const AccountScreen = () => {
  const { accountId } = useParams({ from: '/acc/$accountId' });
  const accountQuery = useLiveQuery((q) =>
    q
      .from({ accounts: database.accounts })
      .where(({ accounts }) => eq(accounts.id, accountId))
      .select(({ accounts }) => ({
        server: accounts.server,
      }))
  );

  const accountServer = accountQuery.data?.[0]?.server;

  useEffect(() => {
    const accountMetadata = database.metadata.get('account');
    if (accountMetadata) {
      database.metadata.update('account', (metadata) => {
        metadata.value = accountId;
        metadata.updatedAt = new Date().toDateString();
      });
    } else {
      database.metadata.insert({
        key: 'account',
        value: accountId,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
    }
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
