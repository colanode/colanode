import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { Event } from '@colanode/client/types';

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

export const useQueryClientBuilder = () => {
  useEffect(() => {
    const id = window.eventBus.subscribe((event: Event) => {
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
        await window.colanode.unsubscribeQuery(event.query.queryKey[0]);
      }
    });

    return () => {
      window.eventBus.unsubscribe(id);
    };
  }, []);

  return queryClient;
};
