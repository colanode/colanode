import { createContext, useContext } from 'react';

interface ContainerContext {
  setSettings: (settings: React.ReactNode) => void;
  resetSettings: () => void;
  setBreadcrumb: (breadcrumb: React.ReactNode) => void;
  resetBreadcrumb: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  scrollViewportRef: React.RefObject<HTMLDivElement>;
}

export const ContainerContext = createContext<ContainerContext>(
  {} as ContainerContext
);

export const useContainer = () => useContext(ContainerContext);
