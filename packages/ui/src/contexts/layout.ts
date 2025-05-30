import { createContext, useContext } from 'react';

interface LayoutContextProps {
  preview: (id: string, keepCurrent?: boolean) => void;
  previewLeft: (id: string, keepCurrent?: boolean) => void;
  previewRight: (id: string, keepCurrent?: boolean) => void;
  open: (id: string) => void;
  openLeft: (id: string) => void;
  openRight: (id: string) => void;
  close: (id: string) => void;
  closeLeft: (id: string) => void;
  closeRight: (id: string) => void;
  activeTab?: string;
}

export const LayoutContext = createContext<LayoutContextProps>(
  {} as LayoutContextProps
);

export const useLayout = () => useContext(LayoutContext);
