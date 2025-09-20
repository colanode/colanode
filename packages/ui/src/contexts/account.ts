import { createContext, useContext } from 'react';

interface AccountContext {
  id: string;
}

export const AccountContext = createContext<AccountContext>(
  {} as AccountContext
);

export const useAccount = () => useContext(AccountContext);
