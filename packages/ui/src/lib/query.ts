import { QueryClient } from '@tanstack/react-query';

import { Event } from '@colanode/client/types';
import { getColanode, getEventBus } from '@colanode/ui/lib/core-api';

export const buildQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'always',
      },
      mutations: {
        networkMode: 'always',
      },
    },
  });

  getEventBus().subscribe((event: Event) => {
    if (event.type === 'query.result.updated') {
      const result = event.result;
      const queryId = event.id;

      if (!queryId) {
        return;
      }

      queryClient.setQueryData([queryId], result);
    }
  });

  queryClient.getQueryCache().subscribe(async (event) => {
    if (
      event.type === 'removed' &&
      event.query &&
      event.query.queryKey &&
      event.query.queryKey.length > 0
    ) {
      await getColanode().unsubscribeQuery(
        event.query.queryKey[0] as string
      );
    }
  });

  return queryClient;
};
