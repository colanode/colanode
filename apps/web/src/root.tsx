// A workaround to make the globals.css file work in the web app
import '../../../packages/ui/src/styles/globals.css';

import { useRegisterSW } from 'virtual:pwa-register/react';

import { RootProvider } from '@colanode/ui';

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

  return <RootProvider type="web" />;
};
