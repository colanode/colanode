import { useEffect, useState } from 'react';

import { ThemeColor, ThemeMode } from '@colanode/client/types';
import { ThemeContext } from '@colanode/ui/contexts/theme';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';
import { getSystemTheme, getThemeVariables } from '@colanode/ui/lib/themes';

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(getSystemTheme());

  const [themeMode] = useMetadata<ThemeMode>('app', 'theme.mode');
  const [themeColor] = useMetadata<ThemeColor>('app', 'theme.color');

  const resolvedThemeMode = themeMode ?? systemTheme;

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

    if (resolvedThemeMode === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    return () => {
      htmlElement.classList.remove('dark');
    };
  }, [resolvedThemeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const themeVariables = getThemeVariables(resolvedThemeMode, themeColor);
    const htmlElement = document.documentElement;

    Object.entries(themeVariables).forEach(([key, value]) => {
      htmlElement.style.setProperty(key, value);
    });
  }, [themeColor, themeMode]);

  return (
    <ThemeContext.Provider
      value={{ mode: resolvedThemeMode, color: themeColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
