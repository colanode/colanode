import { Outlet, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

import { AccountMetadataProvider } from '@colanode/ui/components/accounts/account-metadata-provider';
import { AccountContext } from '@colanode/ui/contexts/account';
import { useAppMetadata } from '@colanode/ui/contexts/app-metadata';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const AccountScreen = () => {
  const appMetadata = useAppMetadata();
  const { accountId } = useParams({ from: '/acc/$accountId' });

  useEffect(() => {
    appMetadata.set('account', accountId);
  }, [accountId]);

  const accountQuery = useLiveQuery({
    type: 'account.get',
    accountId: accountId,
  });

  if (accountQuery.isPending) {
    return null;
  }

  const account = accountQuery.data;
  if (!account) {
    return <p>Account not found</p>;
  }

  return (
    <AccountContext.Provider value={account}>
      <AccountMetadataProvider>
        <Outlet />
      </AccountMetadataProvider>
    </AccountContext.Provider>
  );
};
