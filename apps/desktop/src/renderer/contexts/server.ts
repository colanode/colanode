import { createContext, useContext } from 'react';

import { FeatureKey } from '@/shared/lib/features';
import { Server } from '@/shared/types/servers';

interface ServerContext extends Server {
  supports(feature: FeatureKey): boolean;
}

export const ServerContext = createContext<ServerContext>({} as ServerContext);

export const useServer = () => useContext(ServerContext);
