import { createContext, useContext } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContext {
  value: Theme;
}

export const ThemeContext = createContext<ThemeContext>({} as ThemeContext);

export const useTheme = () => useContext(ThemeContext);
