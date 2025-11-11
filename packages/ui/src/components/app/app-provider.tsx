import { useEffect, useState } from 'react';

import { AppInitOutput, AppType } from '@colanode/client/types';
import { build } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { AppAssets } from '@colanode/ui/components/app/app-assets';
import { AppLayout } from '@colanode/ui/components/app/app-layout';
import { AppLoading } from '@colanode/ui/components/app/app-loading';
import { AppReset } from '@colanode/ui/components/app/app-reset';
import { AppThemeProvider } from '@colanode/ui/components/app/app-theme-provider';
import { RadarProvider } from '@colanode/ui/components/app/radar-provider';
import { AppContext } from '@colanode/ui/contexts/app';

interface AppProviderProps {
  type: AppType;
}

export const AppProvider = ({ type }: AppProviderProps) => {
  const [initOutput, setInitOutput] = useState<AppInitOutput | null>(null);

  useEffect(() => {
    console.log(`Colanode | Version: ${build.version} | SHA: ${build.sha}`);

    window.colanode.init().then((output) => {
      console.log('Colanode | Initialized');

      if (output === 'success') {
        collections
          .preload()
          .then(() => {
            setInitOutput('success');
          })
          .catch((err) => {
            console.error('Colanode | Error preloading', err);
          });
      } else {
        setInitOutput(output);
      }
    });
  }, []);

  return (
    <AppContext.Provider value={{ type }}>
      <AppThemeProvider init={initOutput}>
        <AppAssets />
        {initOutput === null && <AppLoading />}
        {initOutput === 'reset' && <AppReset />}
        {initOutput === 'success' && (
          <RadarProvider>
            <AppLayout type={type} />
          </RadarProvider>
        )}
      </AppThemeProvider>
    </AppContext.Provider>
  );
};
