import { createContext, useContext } from 'react';

import { Server } from '@colanode/client/types';
import { FeatureKey } from '@colanode/ui/lib/features';

interface ServerContext extends Server {
  supports(feature: FeatureKey): boolean;
}

export const ServerContext = createContext<ServerContext>({} as ServerContext);

export const useServer = () => useContext(ServerContext);
