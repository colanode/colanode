import { createContext, useCallback, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

import { ThemeColors, darkColors, lightColors } from '@colanode/mobile/lib/colors';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: ColorScheme;
  preference: ThemePreference;
  setScheme: (scheme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('dark');

  const resolvedScheme: ColorScheme =
    preference === 'system'
      ? (systemScheme ?? 'dark')
      : preference;

  const colors = resolvedScheme === 'dark' ? darkColors : lightColors;

  const setScheme = useCallback(
    (scheme: ThemePreference) => {
      setPreference(scheme);
    },
    []
  );

  return (
    <ThemeContext.Provider
      value={{ colors, scheme: resolvedScheme, preference, setScheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
