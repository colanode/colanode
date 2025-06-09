import { useState, useEffect } from 'react';

import { AppType } from '@colanode/client/types';
import { Account } from '@colanode/ui/components/accounts/account';
import { Login } from '@colanode/ui/components/accounts/login';
import { AppLoader } from '@colanode/ui/components/app-loader';
import { RadarProvider } from '@colanode/ui/components/radar-provider';
import { ServerProvider } from '@colanode/ui/components/servers/server-provider';
import { DelayedComponent } from '@colanode/ui/components/ui/delayed-component';
import { AppContext } from '@colanode/ui/contexts/app';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface AppProps {
  type: AppType;
}

export const App = ({ type }: AppProps) => {
  const [initialized, setInitialized] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);

  const { data: metadata, isPending: isPendingMetadata } = useQuery({
    type: 'app_metadata_list',
  });

  const { data: accounts, isPending: isPendingAccounts } = useQuery({
    type: 'account_list',
  });

  useEffect(() => {
    window.colanode.init().then(() => {
      setInitialized(true);
    });
  }, []);

  if (!initialized || isPendingMetadata || isPendingAccounts) {
    return (
      <DelayedComponent>
        <AppLoader />
      </DelayedComponent>
    );
  }

  const accountMetadata = metadata?.find(
    (metadata) => metadata.key === 'account'
  );

  const account =
    accounts?.find((account) => account.id === accountMetadata?.value) ||
    accounts?.[0];

  return (
    <AppContext.Provider
      value={{
        type,
        getMetadata: (key) => {
          return metadata?.find((metadata) => metadata.key === key)?.value;
        },
        setMetadata: (key, value) => {
          window.colanode.executeMutation({
            type: 'app.metadata.upsert',
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
            type: 'app.metadata.upsert',
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
