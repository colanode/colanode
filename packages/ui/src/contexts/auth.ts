import { createContext, useContext } from 'react';

import { Server } from '@colanode/client/types';

export interface AuthContextValue {
  servers: Server[];
  server: Server;
  setServer: (domain: string) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthLayout');
  }
  return context;
};
