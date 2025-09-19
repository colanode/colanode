import { AppMetadataKey } from '@colanode/client/types';
import { AppMetadataContext } from '@colanode/ui/contexts/app-metadata';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const AppMetadataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const appMetadataListQuery = useLiveQuery({
    type: 'app.metadata.list',
  });

  return (
    <AppMetadataContext.Provider
      value={{
        get: <K extends AppMetadataKey>(key: K) => {
          return appMetadataListQuery.data?.find(
            (metadata) => metadata.key === key
          )?.value;
        },
        set: (key, value) => {
          window.colanode.executeMutation({
            type: 'app.metadata.update',
            key,
            value,
          });
        },
        delete: (key) => {
          window.colanode.executeMutation({
            type: 'app.metadata.delete',
            key,
          });
        },
      }}
    >
      {children}
    </AppMetadataContext.Provider>
  );
};
