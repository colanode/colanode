import { useEffect, useState } from 'react';

import { ThemeMode } from '@colanode/client/types';
import { useApp } from '@colanode/ui/contexts/app';
import { ThemeContext } from '@colanode/ui/contexts/theme';
import { getSystemTheme, getThemeVariables } from '@colanode/ui/lib/themes';

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const app = useApp();
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(getSystemTheme());

  const themeMode = app.getMetadata('theme.mode') ?? systemTheme;
  const themeColor = app.getMetadata('theme.color');

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const htmlElement = document.documentElement;

    if (themeMode === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    return () => {
      htmlElement.classList.remove('dark');
    };
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const themeVariables = getThemeVariables(themeMode, themeColor);
    const htmlElement = document.documentElement;

    Object.entries(themeVariables).forEach(([key, value]) => {
      htmlElement.style.setProperty(key, value);
    });
  }, [themeColor, themeMode]);

  return (
    <ThemeContext.Provider value={{ mode: themeMode, color: themeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};
