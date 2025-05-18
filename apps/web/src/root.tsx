import { RootProvider } from '@colanode/ui';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { AssetProvider } from './asset-provider';

export const Root = () => {
  useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log(`Service Worker at: ${swUrl}`);
      console.log('SW Registered: ' + r?.active);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  return (
    <AssetProvider>
      <RootProvider type="web" />
    </AssetProvider>
  );
};
