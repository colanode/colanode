import '@colanode/ui/styles/index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { Event } from '@colanode/client/types';
import { App } from '@colanode/ui/components/app';
import { Toaster } from '@colanode/ui/components/ui/toaster';
import { TooltipProvider } from '@colanode/ui/components/ui/tooltip';
import { useEventBus } from '@colanode/ui/hooks/use-event-bus';
import { HTML5Backend } from '@colanode/ui/lib/dnd-backend';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
    },
    mutations: {
      networkMode: 'always',
    },
  },
});

export const RootProvider = () => {
  const eventBus = useEventBus();

  React.useEffect(() => {
    const id = eventBus.subscribe((event: Event) => {
      if (event.type === 'query_result_updated') {
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
      eventBus.unsubscribe(id);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <App />
        </TooltipProvider>
        <Toaster />
      </DndProvider>
    </QueryClientProvider>
  );
};
