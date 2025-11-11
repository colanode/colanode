import { createContext, useContext } from 'react';

import { AppType } from '@colanode/client/types';

interface AppContext {
  type: AppType;
}

export const AppContext = createContext<AppContext>({} as AppContext);

export const useApp = () => useContext(AppContext);
