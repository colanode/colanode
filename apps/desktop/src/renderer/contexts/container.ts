import { createContext, useContext } from 'react';

interface ContainerContext {
  nodeId: string;
  mode: 'main' | 'modal' | 'panel';
}

export const ContainerContext = createContext<ContainerContext>(
  {} as ContainerContext
);

export const useContainer = () => useContext(ContainerContext);