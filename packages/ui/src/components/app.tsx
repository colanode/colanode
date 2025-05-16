import { useState, useEffect } from 'react';
import { AppContext } from '@colanode/ui/contexts/app';
import { DelayedComponent } from '@colanode/ui/components/ui/delayed-component';
import { AppLoader } from '@colanode/ui/components/app-loader';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { RadarProvider } from '@colanode/ui/components/radar-provider';
import { Account } from '@colanode/ui/components/accounts/account';
import { Login } from '@colanode/ui/components/accounts/login';
import { AppType } from '@colanode/client/types';

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
            type: 'app_metadata_save',
            key,
            value,
          });
        },
        deleteMetadata: (key: string) => {
          window.colanode.executeMutation({
            type: 'app_metadata_delete',
            key,
          });
        },
        openLogin: () => setOpenLogin(true),
        closeLogin: () => setOpenLogin(false),
        openAccount: (id: string) => {
          setOpenLogin(false);
          window.colanode.executeMutation({
            type: 'app_metadata_save',
            key: 'account',
            value: id,
          });
        },
        getEmojiUrl: (id: string) => {
          if (type === 'desktop') {
            return `asset://emojis/${id}`;
          }

          return `/asset/emojis/${id}`;
        },
        getIconUrl: (id: string) => {
          if (type === 'desktop') {
            return `asset://icons/${id}`;
          }

          return `/asset/icons/${id}`;
        },
        getAvatarUrl: (accountId: string, avatar: string) => {
          if (type === 'desktop') {
            return `avatar://${accountId}/${avatar}`;
          }

          return `/avatars/${accountId}/${avatar}`;
        },
      }}
    >
      <RadarProvider>
        {!openLogin && account ? (
          <Account key={account.id} account={account} />
        ) : (
          <Login />
        )}
      </RadarProvider>
    </AppContext.Provider>
  );
};
