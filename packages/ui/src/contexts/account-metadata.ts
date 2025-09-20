import { createContext, useContext } from 'react';

import { AccountMetadataKey, AccountMetadataMap } from '@colanode/client/types';

interface AccountMetadataContext {
  get: <K extends AccountMetadataKey>(
    key: K
  ) => AccountMetadataMap[K]['value'] | undefined;
  set: <K extends AccountMetadataKey>(
    key: K,
    value: AccountMetadataMap[K]['value']
  ) => void;
  delete: <K extends AccountMetadataKey>(key: K) => void;
}

export const AccountMetadataContext = createContext<AccountMetadataContext>(
  {} as AccountMetadataContext
);

export const useAccountMetadata = () => useContext(AccountMetadataContext);
