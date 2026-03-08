import { QueryClient } from '@tanstack/react-query';

import { eventBus } from '@colanode/client/lib';
import { Mediator } from '@colanode/client/handlers';
import { Event } from '@colanode/client/types';

const MOBILE_WINDOW_ID = 'mobile-window';

export const buildQueryClient = (mediator: Mediator): QueryClient => {
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

  eventBus.subscribe((event: Event) => {
    if (event.type === 'query.result.updated') {
      const result = event.result;
      const queryId = event.id;

      if (!queryId) {
        return;
      }

      queryClient.setQueryData([queryId], result);
    }
  });

  queryClient.getQueryCache().subscribe((event) => {
    if (
      event.type === 'removed' &&
      event.query &&
      event.query.queryKey &&
      event.query.queryKey.length > 0
    ) {
      mediator.unsubscribeQuery(
        event.query.queryKey[0] as string,
        MOBILE_WINDOW_ID
      );
    }
  });

  return queryClient;
};
