import { useMemo } from 'react';

import { useApp } from '@colanode/ui/contexts/app';

const mobileDeviceRegex =
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;

export const useIsMobile = (): boolean => {
  const app = useApp();
  if (app.type === 'mobile') {
    return true;
  }

  return useMemo(() => {
    return mobileDeviceRegex.test(navigator.userAgent);
  }, []);
};
