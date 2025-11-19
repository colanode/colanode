import { createContext, useContext } from 'react';

export type ContainerType = 'full' | 'modal';

interface ContainerContext {
  type: ContainerType;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  scrollViewportRef: React.RefObject<HTMLDivElement>;
}

export const ContainerContext = createContext<ContainerContext>(
  {} as ContainerContext
);

export const useContainer = () => useContext(ContainerContext);
