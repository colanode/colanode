import { useEffect } from 'react';

import { AppInitOutput, ThemeColor, ThemeMode } from '@colanode/client/types';
import { ThemeContext } from '@colanode/ui/contexts/theme';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';
import { useSystemTheme } from '@colanode/ui/hooks/use-system-theme';
import { getThemeVariables } from '@colanode/ui/lib/themes';

const useApplyTheme = (mode: ThemeMode, color?: ThemeColor) => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const htmlElement = document.documentElement;

    if (mode === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    // Ensure cleanup removes the class on unmount or before next effect
    return () => {
      htmlElement.classList.remove('dark');
    };
  }, [mode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const themeVariables = getThemeVariables(mode, color);
    const htmlElement = document.documentElement;

    Object.entries(themeVariables).forEach(([key, value]) => {
      htmlElement.style.setProperty(key, value);
    });
  }, [mode, color]);
};

const AppThemeProviderInitialized = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const systemTheme = useSystemTheme();

  const [themeMode] = useMetadata<ThemeMode>('app', 'theme.mode');
  const [themeColor] = useMetadata<ThemeColor>('app', 'theme.color');

  const resolvedThemeMode = themeMode ?? systemTheme;

  useApplyTheme(resolvedThemeMode, themeColor);

  return (
    <ThemeContext.Provider
      value={{ mode: resolvedThemeMode, color: themeColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const AppThemeProviderUninitialized = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const systemTheme = useSystemTheme();
  useApplyTheme(systemTheme, undefined);

  return (
    <ThemeContext.Provider value={{ mode: systemTheme, color: undefined }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const AppThemeProvider = ({
  children,
  init,
}: {
  children: React.ReactNode;
  init: AppInitOutput | null;
}) => {
  if (init !== 'success') {
    return (
      <AppThemeProviderUninitialized>{children}</AppThemeProviderUninitialized>
    );
  }

  return <AppThemeProviderInitialized>{children}</AppThemeProviderInitialized>;
};
