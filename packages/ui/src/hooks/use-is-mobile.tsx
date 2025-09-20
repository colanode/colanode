import { useMemo } from 'react';

const mobileDeviceRegex =
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;

export const useIsMobile = (): boolean => {
  return useMemo(() => {
    return mobileDeviceRegex.test(navigator.userAgent);
  }, []);
};
