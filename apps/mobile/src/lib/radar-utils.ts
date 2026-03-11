import { getIdType, IdType } from '@colanode/core';

import { WorkspaceRadarData } from '@colanode/client/types/radars';

export const getChatUnreadCount = (
  radarData: Record<string, WorkspaceRadarData> | undefined,
  userId: string
): number => {
  const workspaceRadar = radarData?.[userId];
  if (!workspaceRadar) return 0;

  let count = 0;
  for (const [id, nodeState] of Object.entries(workspaceRadar.nodeStates)) {
    if (getIdType(id) === IdType.Chat && nodeState.unreadCount > 0) {
      count += nodeState.unreadCount;
    }
  }
  return count;
};

export const getUnreadSummary = (
  radarData: Record<string, WorkspaceRadarData> | undefined,
  userId: string
): { totalUnread: number; unreadChats: number } => {
  const workspaceRadar = radarData?.[userId];
  if (!workspaceRadar) return { totalUnread: 0, unreadChats: 0 };

  let totalUnread = 0;
  let unreadChats = 0;
  for (const [id, nodeState] of Object.entries(workspaceRadar.nodeStates)) {
    if (nodeState.unreadCount > 0) {
      totalUnread += nodeState.unreadCount;
      if (getIdType(id) === IdType.Chat) {
        unreadChats++;
      }
    }
  }
  return { totalUnread, unreadChats };
};

export const getNodeUnreadCount = (
  radarData: Record<string, WorkspaceRadarData> | undefined,
  userId: string,
  nodeId: string
): number => {
  return radarData?.[userId]?.nodeStates[nodeId]?.unreadCount ?? 0;
};
