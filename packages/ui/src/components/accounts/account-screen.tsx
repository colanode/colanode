import { Outlet, useParams } from '@tanstack/react-router';

import { AccountContext } from '@colanode/ui/contexts/account';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const AccountScreen = () => {
  const { accountId } = useParams({ from: '/acc/$accountId' });

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
      <Outlet />
    </AccountContext.Provider>
  );
};
