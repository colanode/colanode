import { createContext, useContext } from 'react';

interface LayoutContextProps {
  openInNewTab: (url: string) => void;
}

export const LayoutContext = createContext<LayoutContextProps>(
  {} as LayoutContextProps
);

export const useLayout = () => useContext(LayoutContext);
