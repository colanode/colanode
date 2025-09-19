import { createContext, useContext } from 'react';

import { Account } from '@colanode/client/types';

export const AccountContext = createContext<Account>({} as Account);

export const useAccount = () => useContext(AccountContext);
