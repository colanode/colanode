import { useEffect, useState } from 'react';

import { useApp } from '@colanode/ui/contexts/app';
import { Theme, ThemeContext } from '@colanode/ui/contexts/theme';

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }

  const isDark = window.matchMedia('(prefers-color-scheme: dark)')?.matches;
  return isDark ? 'dark' : 'light';
};

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const app = useApp();
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme());
  const appTheme = app.getMetadata('theme');
  const theme = !appTheme || appTheme === 'system' ? systemTheme : appTheme;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Apply theme class to root HTML element
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const htmlElement = document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    return () => {
      htmlElement.classList.remove('dark');
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ value: theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
