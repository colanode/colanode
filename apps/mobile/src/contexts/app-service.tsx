import { createContext, useContext } from 'react';

import { AppService } from '@colanode/client/services';

interface AppServiceContextValue {
  appService: AppService;
}

export const AppServiceContext = createContext<AppServiceContextValue | null>(
  null
);

export const useAppService = (): AppServiceContextValue => {
  const ctx = useContext(AppServiceContext);
  if (!ctx) {
    throw new Error('useAppService must be used within AppServiceProvider');
  }
  return ctx;
};
