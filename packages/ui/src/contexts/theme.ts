import { createContext, useContext } from 'react';

import { ThemeColor, ThemeMode } from '@colanode/client/types';

interface ThemeContext {
  mode: ThemeMode;
  color?: ThemeColor;
}

export const ThemeContext = createContext<ThemeContext>({} as ThemeContext);

export const useTheme = () => useContext(ThemeContext);
