import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';

import { AppType } from '@colanode/client/types';
import { build } from '@colanode/core';
import { AppAssets } from '@colanode/ui/components/app/app-assets';
import { AppLayout } from '@colanode/ui/components/app/app-layout';
import { AppLoadingScreen } from '@colanode/ui/components/app/app-loading-screen';
import { AppThemeProvider } from '@colanode/ui/components/app/app-theme-provider';
import { RadarProvider } from '@colanode/ui/components/app/radar-provider';
import { Toaster } from '@colanode/ui/components/ui/sonner';
import { TooltipProvider } from '@colanode/ui/components/ui/tooltip';
import { AppContext } from '@colanode/ui/contexts/app';
import { useAppStoreSubscriptions } from '@colanode/ui/hooks/use-app-store-subscribtions';
import { useQueryClientBuilder } from '@colanode/ui/hooks/use-query-client-builder';
import { HTML5Backend } from '@colanode/ui/lib/dnd-backend';
import { useAppStore } from '@colanode/ui/stores/app';

interface AppProps {
  type: AppType;
}

export const App = ({ type }: AppProps) => {
  const isInitialized = useAppStore((state) => state.initialized);
  const initialize = useAppStore((state) => state.initialize);

  const queryClient = useQueryClientBuilder();
  useAppStoreSubscriptions();

  useEffect(() => {
    console.log(`Colanode | Version: ${build.version} | SHA: ${build.sha}`);

    window.colanode.init().then(async () => {
      const appState = await window.colanode.executeQuery({
        type: 'app.state',
      });
      initialize(appState);
    });
  }, []);

  if (!isInitialized) {
    return <AppLoadingScreen />;
  }

  return (
    <AppContext.Provider value={{ type }}>
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <TooltipProvider>
            <AppAssets />
            <AppThemeProvider>
              <RadarProvider>
                <AppLayout />
              </RadarProvider>
            </AppThemeProvider>
          </TooltipProvider>
          <Toaster />
        </DndProvider>
      </QueryClientProvider>
    </AppContext.Provider>
  );
};
