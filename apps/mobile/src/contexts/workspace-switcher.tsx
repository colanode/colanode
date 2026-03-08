import { createContext, useContext } from 'react';

interface WorkspaceSwitcherContextValue {
  openSwitcher: () => void;
}

export const WorkspaceSwitcherContext =
  createContext<WorkspaceSwitcherContextValue | null>(null);

export const useWorkspaceSwitcher = (): WorkspaceSwitcherContextValue => {
  const ctx = useContext(WorkspaceSwitcherContext);
  if (!ctx) {
    throw new Error(
      'useWorkspaceSwitcher must be used within WorkspaceSwitcherContext.Provider'
    );
  }
  return ctx;
};
