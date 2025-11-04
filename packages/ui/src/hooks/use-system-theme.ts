import { useEffect, useState } from 'react';

import { ThemeMode } from '@colanode/client/types';

export const useSystemTheme = (): ThemeMode => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(
    mediaQuery.matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return systemTheme;
};
