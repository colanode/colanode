import { useEffect, useState } from 'react';

type SystemTheme = 'dark' | 'light';

export const useSystemTheme = (): SystemTheme => {
  const [theme, setTheme] = useState<SystemTheme>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light';
    }

    const isDark = window.matchMedia('(prefers-color-scheme: dark)')?.matches;
    return isDark ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return theme;
};
