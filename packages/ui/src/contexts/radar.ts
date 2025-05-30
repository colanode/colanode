import { createContext, useContext } from 'react';

import { WorkspaceRadarData, UnreadState } from '@colanode/client/types';

interface RadarContext {
  getAccountState: (accountId: string) => UnreadState;
  getWorkspaceState: (
    accountId: string,
    workspaceId: string
  ) => WorkspaceRadarData;
  getNodeState: (
    accountId: string,
    workspaceId: string,
    nodeId: string
  ) => UnreadState;
  markNodeAsSeen: (
    accountId: string,
    workspaceId: string,
    nodeId: string
  ) => void;
  markNodeAsOpened: (
    accountId: string,
    workspaceId: string,
    nodeId: string
  ) => void;
}

export const RadarContext = createContext<RadarContext>({} as RadarContext);

export const useRadar = () => useContext(RadarContext);
