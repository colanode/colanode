import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection } from '@tanstack/react-db';
import { QueryClient } from '@tanstack/react-query';

import { buildQueryKey, TabsListQueryInput } from '@colanode/client/queries';

export const createTabsCollection = (queryClient: QueryClient) => {
  const input: TabsListQueryInput = {
    type: 'tabs.list',
  };

  const key = buildQueryKey(input);

  return createCollection(
    queryCollectionOptions({
      id: key,
      queryKey: [key],
      queryClient,
      getKey: (item) => item.id,
      queryFn: async () => {
        return await window.colanode.executeQueryAndSubscribe(key, input);
      },
      onInsert: async ({ transaction }) => {
        const tab = transaction.mutations[0].modified;
        return await window.colanode.executeMutation({
          type: 'tab.create',
          id: tab.id,
          location: tab.location,
          index: tab.index,
        });
      },
      onUpdate: async ({ transaction }) => {
        return await Promise.all(
          transaction.mutations.map(async (mutation) => {
            const { original, changes } = mutation;
            if (!(`id` in original)) {
              throw new Error(`Original todo not found for update`);
            }

            return await window.colanode.executeMutation({
              type: 'tab.update',
              id: original.id,
              location: changes.location,
              index: changes.index,
            });
          })
        );
      },
      onDelete: async ({ transaction }) => {
        return await Promise.all(
          transaction.mutations.map(async (mutation) => {
            const { original } = mutation;
            if (!(`id` in original)) {
              throw new Error(`Original todo not found for delete`);
            }

            await window.colanode.executeMutation({
              type: 'tab.delete',
              id: original.id,
            });
          })
        );
      },
    })
  );
};
