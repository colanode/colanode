import { useAccount } from '@colanode/ui/contexts/account';
import { AccountMetadataContext } from '@colanode/ui/contexts/account-metadata';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const AccountMetadataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const account = useAccount();
  const accountMetadataListQuery = useLiveQuery({
    type: 'account.metadata.list',
    accountId: account.id,
  });

  if (accountMetadataListQuery.isPending) {
    return null;
  }

  return (
    <AccountMetadataContext.Provider
      value={{
        get: (key) => {
          return accountMetadataListQuery.data?.find(
            (metadata) => metadata.key === key
          )?.value;
        },
        set: (key, value) => {
          window.colanode.executeMutation({
            type: 'account.metadata.update',
            accountId: account.id,
            key,
            value,
          });
        },
        delete: (key) => {
          window.colanode.executeMutation({
            type: 'account.metadata.delete',
            accountId: account.id,
            key,
          });
        },
      }}
    >
      {children}
    </AccountMetadataContext.Provider>
  );
};
