import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';

import { AppType, Event } from '@colanode/client/types';
import { build } from '@colanode/core';
import { AppAssets } from '@colanode/ui/components/app/app-assets';
import { AppLayout } from '@colanode/ui/components/app/app-layout';
import { AppLoadingScreen } from '@colanode/ui/components/app/app-loading-screen';
import { AppMetadataProvider } from '@colanode/ui/components/app/app-metadata-provider';
import { AppThemeProvider } from '@colanode/ui/components/app/app-theme-provider';
import { RadarProvider } from '@colanode/ui/components/app/radar-provider';
import { Toaster } from '@colanode/ui/components/ui/sonner';
import { TooltipProvider } from '@colanode/ui/components/ui/tooltip';
import { AppContext } from '@colanode/ui/contexts/app';
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

interface AppProps {
  type: AppType;
}

export const App = ({ type }: AppProps) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log(`Colanode | Version: ${build.version} | SHA: ${build.sha}`);

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

    window.colanode.init().then(() => {
      setInitialized(true);
    });

    return () => {
      window.eventBus.unsubscribe(id);
    };
  }, []);

  if (!initialized) {
    return <AppLoadingScreen />;
  }

  return (
    <AppContext.Provider value={{ type }}>
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <TooltipProvider>
            <AppAssets />
            <AppMetadataProvider>
              <AppThemeProvider>
                <RadarProvider>
                  <AppLayout />
                </RadarProvider>
              </AppThemeProvider>
            </AppMetadataProvider>
          </TooltipProvider>
          <Toaster />
        </DndProvider>
      </QueryClientProvider>
    </AppContext.Provider>
  );
};
