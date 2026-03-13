import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { ThemeColors, darkColors, lightColors } from '@colanode/mobile/lib/colors';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
export const THEME_PREFERENCE_NAMESPACE = 'app';
export const THEME_PREFERENCE_KEY = 'theme.preference';

export const isThemePreference = (
  value: unknown
): value is ThemePreference => {
  return value === 'light' || value === 'dark' || value === 'system';
};

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: ColorScheme;
  preference: ThemePreference;
  setScheme: (scheme: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialPreference?: ThemePreference;
  onPreferenceChange?: (scheme: ThemePreference) => void | Promise<void>;
}

export const ThemeProvider = ({
  children,
  initialPreference = DEFAULT_THEME_PREFERENCE,
  onPreferenceChange,
}: ThemeProviderProps) => {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(
    initialPreference
  );

  useEffect(() => {
    setPreference(initialPreference);
  }, [initialPreference]);

  const resolvedScheme: ColorScheme =
    preference === 'system'
      ? (systemScheme ?? 'dark')
      : preference;

  const colors = resolvedScheme === 'dark' ? darkColors : lightColors;

  const setScheme = useCallback(
    async (scheme: ThemePreference) => {
      if (scheme === preference) {
        return;
      }

      await onPreferenceChange?.(scheme);
      setPreference(scheme);
    },
    [onPreferenceChange, preference]
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
