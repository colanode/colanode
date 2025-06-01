import { createContext, useContext } from 'react';

import {
  AppMetadataKey,
  AppMetadataMap,
  AppType,
} from '@colanode/client/types';

interface AppContext {
  type: AppType;
  getMetadata: <K extends AppMetadataKey>(
    key: K
  ) => AppMetadataMap[K]['value'] | undefined;
  setMetadata: <K extends AppMetadataKey>(
    key: K,
    value: AppMetadataMap[K]['value']
  ) => void;
  deleteMetadata: <K extends AppMetadataKey>(key: K) => void;
  openLogin: () => void;
  closeLogin: () => void;
  openAccount: (id: string) => void;
}

export const AppContext = createContext<AppContext>({} as AppContext);

export const useApp = () => useContext(AppContext);
