import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection } from '@tanstack/react-db';
import { QueryClient } from '@tanstack/react-query';

import { buildQueryKey, ServerListQueryInput } from '@colanode/client/queries';

export const createServersCollection = (queryClient: QueryClient) => {
  const input: ServerListQueryInput = {
    type: 'server.list',
  };

  const key = buildQueryKey(input);

  return createCollection(
    queryCollectionOptions({
      id: 'servers',
      queryKey: [key],
      queryClient,
      getKey: (item) => item.domain,
      queryFn: async () => {
        console.log('Colanode | Executing query', key, input);
        return await window.colanode.executeQueryAndSubscribe(key, input);
      },
    })
  );
};
