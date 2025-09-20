import { Outlet, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

import { AccountContext } from '@colanode/ui/contexts/account';
import { useAppStore } from '@colanode/ui/stores/app';

export const AccountScreen = () => {
  const { accountId } = useParams({ from: '/acc/$accountId' });
  const accountExists = useAppStore((state) => !!state.accounts[accountId]);

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

  if (!accountExists) {
    return <p>Account not found</p>;
  }

  return (
    <AccountContext.Provider value={{ id: accountId }}>
      <Outlet />
    </AccountContext.Provider>
  );
};
