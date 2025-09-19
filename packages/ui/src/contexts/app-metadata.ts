import { createContext, useContext } from 'react';

import { AppMetadataKey, AppMetadataMap } from '@colanode/client/types';

interface AppMetadataContext {
  get: <K extends AppMetadataKey>(
    key: K
  ) => AppMetadataMap[K]['value'] | undefined;
  set: <K extends AppMetadataKey>(
    key: K,
    value: AppMetadataMap[K]['value']
  ) => void;
  delete: <K extends AppMetadataKey>(key: K) => void;
}

export const AppMetadataContext = createContext<AppMetadataContext>(
  {} as AppMetadataContext
);

export const useAppMetadata = () => useContext(AppMetadataContext);
