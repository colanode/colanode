import { createContext, useContext } from 'react';

import {
  AccountReadState,
  ChannelReadState,
  ChatReadState,
  WorkspaceReadState,
} from '@/shared/types/radars';

interface RadarContext {
  getAccountState: (accountId: string) => AccountReadState;
  getWorkspaceState: (userId: string) => WorkspaceReadState;
  getChatState: (userId: string, nodeId: string) => ChatReadState;
  getChannelState: (userId: string, nodeId: string) => ChannelReadState;
  markAsSeen: (userId: string, nodeId: string, versionId: string) => void;
}

export const RadarContext = createContext<RadarContext>({} as RadarContext);

export const useRadar = () => useContext(RadarContext);
