import { createContext, useContext } from 'react';

import { Account } from '@colanode/client/types';

interface AccountContext extends Account {
  openWorkspace: (id: string) => void;
  openWorkspaceCreate: () => void;
}

export const AccountContext = createContext<AccountContext>(
  {} as AccountContext
);

export const useAccount = () => useContext(AccountContext);
