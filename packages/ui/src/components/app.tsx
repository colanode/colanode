import { useState, useEffect } from 'react';

import { AppType } from '@colanode/client/types';
import { AppThemeProvider } from '@colanode/ui/components/app/app-theme-provider';
import { AppLayout } from '@colanode/ui/components/app-layout';
import { AppLoader } from '@colanode/ui/components/app-loader';
import { RadarProvider } from '@colanode/ui/components/radar-provider';
import { AppContext } from '@colanode/ui/contexts/app';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface AppProps {
  type: AppType;
}

export const App = ({ type }: AppProps) => {
  const [initialized, setInitialized] = useState(false);

  const appMetadataListQuery = useLiveQuery(
    {
      type: 'app.metadata.list',
    },
    {
      enabled: initialized,
    }
  );

  useEffect(() => {
    window.colanode.init().then(() => {
      setInitialized(true);
    });
  }, []);

  if (!initialized || appMetadataListQuery.isPending) {
    return <AppLoader />;
  }

  return (
    <AppContext.Provider
      value={{
        type,
        getMetadata: (key) => {
          return appMetadataListQuery.data?.find(
            (metadata) => metadata.key === key
          )?.value;
        },
        setMetadata: (key, value) => {
          window.colanode.executeMutation({
            type: 'app.metadata.update',
            key,
            value,
          });
        },
        deleteMetadata: (key: string) => {
          window.colanode.executeMutation({
            type: 'app.metadata.delete',
            key,
          });
        },
        openLogin: () => {
          throw new Error('Not implemented');
        },
        closeLogin: () => {
          throw new Error('Not implemented');
        },
        openAccount: (id: string) => {
          window.colanode.executeMutation({
            type: 'app.metadata.update',
            key: 'account',
            value: id,
          });
        },
      }}
    >
      <AppThemeProvider>
        <RadarProvider>
          <AppLayout />
        </RadarProvider>
      </AppThemeProvider>
    </AppContext.Provider>
  );
};
