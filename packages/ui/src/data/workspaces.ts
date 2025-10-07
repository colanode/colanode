import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection } from '@tanstack/react-db';
import { QueryClient } from '@tanstack/react-query';

import {
  buildQueryKey,
  WorkspaceListQueryInput,
} from '@colanode/client/queries';

export const createWorkspacesCollection = (
  queryClient: QueryClient,
  accountId: string
) => {
  const input: WorkspaceListQueryInput = {
    type: 'workspace.list',
    accountId,
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
    })
  );
};
