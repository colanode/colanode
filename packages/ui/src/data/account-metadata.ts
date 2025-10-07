import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection } from '@tanstack/react-db';
import { QueryClient } from '@tanstack/react-query';

import {
  AccountMetadataListQueryInput,
  buildQueryKey,
} from '@colanode/client/queries';

export const createAccountMetadataCollection = (
  queryClient: QueryClient,
  accountId: string
) => {
  const input: AccountMetadataListQueryInput = {
    type: 'account.metadata.list',
    accountId,
  };
  const key = buildQueryKey(input);

  return createCollection(
    queryCollectionOptions({
      id: key,
      queryKey: [key],
      queryClient,
      getKey: (item) => item.key,
      queryFn: async () => {
        return await window.colanode.executeQueryAndSubscribe(key, input);
      },
      onInsert: async ({ transaction }) => {
        const metadata = transaction.mutations[0].modified;
        return await window.colanode.executeMutation({
          type: 'account.metadata.update',
          accountId,
          key: metadata.key,
          value: metadata.value,
        });
      },
      onUpdate: async ({ transaction }) => {
        return await Promise.all(
          transaction.mutations.map(async (mutation) => {
            const { original, changes } = mutation;
            if (!(`key` in original)) {
              throw new Error(`Original todo not found for update`);
            }

            if (!changes.value) {
              return;
            }

            return await window.colanode.executeMutation({
              type: 'account.metadata.update',
              accountId,
              key: original.key,
              value: changes.value,
            });
          })
        );
      },
      onDelete: async ({ transaction }) => {
        return await Promise.all(
          transaction.mutations.map(async (mutation) => {
            const { original } = mutation;
            if (!(`key` in original)) {
              throw new Error(`Original app metadata not found for delete`);
            }

            await window.colanode.executeMutation({
              type: 'account.metadata.delete',
              accountId,
              key: original.key,
            });
          })
        );
      },
    })
  );
};
