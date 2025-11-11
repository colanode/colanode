import { createContext, useContext } from 'react';

import { FeatureKey } from '@colanode/client/lib';
import { Server } from '@colanode/client/types';

interface ServerContext extends Server {
  supports(feature: FeatureKey): boolean;
}

export const ServerContext = createContext<ServerContext>({} as ServerContext);

export const useServer = () => useContext(ServerContext);
