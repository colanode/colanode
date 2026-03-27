import { createContext, useContext } from 'react';

interface NavigationContext {
  openNode: (nodeId: string, nodeType: string) => void;
}

export const NavigationContext = createContext<NavigationContext>(
  {} as NavigationContext
);

export const useNavigation = () => useContext(NavigationContext);
