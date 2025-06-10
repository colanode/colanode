import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';

import { AppType, Event } from '@colanode/client/types';
import { App } from '@colanode/ui/components/app';
import { FontLoader } from '@colanode/ui/components/font-loader';
import { Toaster } from '@colanode/ui/components/ui/sonner';
import { TooltipProvider } from '@colanode/ui/components/ui/tooltip';
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

interface RootProviderProps {
  type: AppType;
}

export const RootProvider = ({ type }: RootProviderProps) => {
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

  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <FontLoader type={type} />
          <App type={type} />
        </TooltipProvider>
        <Toaster />
      </DndProvider>
    </QueryClientProvider>
  );
};
