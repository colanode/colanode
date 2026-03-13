import { File, Paths } from 'expo-file-system';
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

const THEME_PREFERENCE_FILE = new File(Paths.document, 'theme-preference.json');

const isThemePreference = (value: unknown): value is ThemePreference => {
  return value === 'light' || value === 'dark' || value === 'system';
};

const readStoredPreference = async (): Promise<ThemePreference | null> => {
  try {
    if (!THEME_PREFERENCE_FILE.exists) {
      return null;
    }

    const text = await THEME_PREFERENCE_FILE.text();
    const parsed = JSON.parse(text) as { preference?: unknown };
    return isThemePreference(parsed.preference) ? parsed.preference : null;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to read theme preference:', error);
    }
    return null;
  }
};

const writeStoredPreference = async (
  preference: ThemePreference
): Promise<void> => {
  try {
    await THEME_PREFERENCE_FILE.write(JSON.stringify({ preference }));
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to persist theme preference:', error);
    }
  }
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedPreference = await readStoredPreference();
      if (!cancelled && storedPreference) {
        setPreference(storedPreference);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedScheme: ColorScheme =
    preference === 'system'
      ? (systemScheme ?? 'dark')
      : preference;

  const colors = resolvedScheme === 'dark' ? darkColors : lightColors;

  const setScheme = useCallback(
    (scheme: ThemePreference) => {
      setPreference(scheme);
      void writeStoredPreference(scheme);
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
