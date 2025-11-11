import { createContext, useContext } from 'react';

import { WorkspaceRadarData, UnreadState } from '@colanode/client/types';

interface RadarContext {
  getAccountState: (accountId: string) => UnreadState;
  getWorkspaceState: (userId: string) => WorkspaceRadarData;
  getNodeState: (userId: string, nodeId: string) => UnreadState;
  getChatsState: (userId: string) => UnreadState;
  getChannelsState: (userId: string) => UnreadState;
  markNodeAsSeen: (userId: string, nodeId: string) => void;
  markNodeAsOpened: (userId: string, nodeId: string) => void;
}

export const RadarContext = createContext<RadarContext>({} as RadarContext);

export const useRadar = () => useContext(RadarContext);
