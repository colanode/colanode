import '@/renderer/styles/index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { createRoot } from 'react-dom/client';
import { Event } from '@colanode/client/types';

import { HTML5Backend } from '@/shared/lib/dnd-backend';
import { App } from '@/renderer/app';
import { Toaster } from '@/renderer/components/ui/toaster';
import { TooltipProvider } from '@/renderer/components/ui/tooltip';
import { useEventBus } from '@/renderer/hooks/use-event-bus';

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

const Root = () => {
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

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
