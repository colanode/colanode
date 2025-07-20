import { useState, useEffect } from 'react';

import { AppType } from '@colanode/client/types';
import { Account } from '@colanode/ui/components/accounts/account';
import { Login } from '@colanode/ui/components/accounts/login';
import { AppLoader } from '@colanode/ui/components/app-loader';
import { RadarProvider } from '@colanode/ui/components/radar-provider';
import { ServerProvider } from '@colanode/ui/components/servers/server-provider';
import { DelayedComponent } from '@colanode/ui/components/ui/delayed-component';
import { AppContext } from '@colanode/ui/contexts/app';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface AppProps {
  type: AppType;
}

export const App = ({ type }: AppProps) => {
  const [initialized, setInitialized] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);

  const appMetadataListQuery = useLiveQuery({
    type: 'app.metadata.list',
  });

  const accountListQuery = useLiveQuery({
    type: 'account.list',
  });

  useEffect(() => {
    window.colanode.init().then(() => {
      setInitialized(true);
    });
  }, []);

  if (
    !initialized ||
    appMetadataListQuery.isPending ||
    accountListQuery.isPending
  ) {
    return (
      <DelayedComponent>
        <AppLoader />
      </DelayedComponent>
    );
  }

  const accountMetadata = appMetadataListQuery.data?.find(
    (metadata) => metadata.key === 'account'
  );

  const account =
    accountListQuery.data?.find(
      (account) => account.id === accountMetadata?.value
    ) || accountListQuery.data?.[0];

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
        openLogin: () => setOpenLogin(true),
        closeLogin: () => setOpenLogin(false),
        openAccount: (id: string) => {
          setOpenLogin(false);
          window.colanode.executeMutation({
            type: 'app.metadata.update',
            key: 'account',
            value: id,
          });
        },
      }}
    >
      <RadarProvider>
        {!openLogin && account ? (
          <ServerProvider domain={account.server}>
            <Account key={account.id} account={account} />
          </ServerProvider>
        ) : (
          <Login />
        )}
      </RadarProvider>
    </AppContext.Provider>
  );
};
