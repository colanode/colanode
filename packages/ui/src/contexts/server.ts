import { createContext, useContext } from 'react';

import { FeatureKey } from '@colanode/client/lib';
import { ServerDetails } from '@colanode/client/types';

interface ServerContext extends ServerDetails {
  supports(feature: FeatureKey): boolean;
}

export const ServerContext = createContext<ServerContext>({} as ServerContext);

export const useServer = () => useContext(ServerContext);
