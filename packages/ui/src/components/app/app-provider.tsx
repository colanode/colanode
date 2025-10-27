import { useEffect, useState } from 'react';

import { AppType } from '@colanode/client/types';
import { build } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { AppAssets } from '@colanode/ui/components/app/app-assets';
import { AppLayout } from '@colanode/ui/components/app/app-layout';
import { AppLoadingScreen } from '@colanode/ui/components/app/app-loading-screen';
import { AppThemeProvider } from '@colanode/ui/components/app/app-theme-provider';
import { RadarProvider } from '@colanode/ui/components/app/radar-provider';
import { AppContext } from '@colanode/ui/contexts/app';

interface AppProviderProps {
  type: AppType;
}

export const AppProvider = ({ type }: AppProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log(`Colanode | Version: ${build.version} | SHA: ${build.sha}`);

    window.colanode.init().then(() => {
      console.log('Colanode | Initialized');

      collections
        .preload()
        .then(() => {
          setIsInitialized(true);
        })
        .catch((err) => {
          console.error('Colanode | Error preloading', err);
        });
    });
  }, []);

  if (!isInitialized) {
    return <AppLoadingScreen />;
  }

  return (
    <AppContext.Provider value={{ type }}>
      <AppAssets />
      <AppThemeProvider>
        <RadarProvider>
          <AppLayout type={type} />
        </RadarProvider>
      </AppThemeProvider>
    </AppContext.Provider>
  );
};
