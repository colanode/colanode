import { useMatch, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Account } from '@colanode/client/types';
import { AccountContext } from '@colanode/ui/contexts/account';
// import { useApp } from '@colanode/ui/contexts/app';

const fetchAccountForWorkspace = async (
  workspaceId?: string
): Promise<Account[] | null> => {
  const accounts = await window.colanode.executeQuery({
    type: 'account.list',
  });

  if (accounts.length === 0) {
    return null;
  }

  if (!workspaceId) {
    return [accounts[0]!];
  }

  const accountsForWorkspace: Account[] = [];
  for (const account of accounts) {
    const workspaces = await window.colanode.executeQuery({
      type: 'workspace.list',
      accountId: account.id,
    });

    if (workspaces.some((workspace) => workspace.id === workspaceId)) {
      accountsForWorkspace.push(account);
    }
  }

  if (accountsForWorkspace.length === 0) {
    return [accounts[0]!];
  }

  return accountsForWorkspace;
};

export const AccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // const app = useApp();
  const navigate = useNavigate();
  const match = useMatch({ from: '/$workspaceId', shouldThrow: false });
  const workspaceId = match?.params.workspaceId;
  // const accountId = app.getMetadata('account');

  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    (async () => {
      const accounts = await fetchAccountForWorkspace(workspaceId);
      if (!accounts) {
        navigate({ to: '/login' });
        return;
      }

      setAccount(accounts[0]!);
    })();
  }, [workspaceId]);

  if (!account) {
    return null;
  }

  return (
    <AccountContext.Provider value={account}>
      {children}
    </AccountContext.Provider>
  );
};
