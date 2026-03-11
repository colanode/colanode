import { getIdType, IdType } from '@colanode/core';

interface UnreadSummary {
  totalUnread: number;
  unreadChats: number;
  chatUnreadCount: number;
}

export const computeUnreadSummary = (
  nodeStates: Record<string, { unreadCount: number }> | undefined
): UnreadSummary => {
  let totalUnread = 0;
  let unreadChats = 0;
  let chatUnreadCount = 0;

  if (!nodeStates) {
    return { totalUnread, unreadChats, chatUnreadCount };
  }

  for (const [id, nodeState] of Object.entries(nodeStates)) {
    if (nodeState.unreadCount > 0) {
      totalUnread += nodeState.unreadCount;
      if (getIdType(id) === IdType.Chat) {
        unreadChats++;
        chatUnreadCount += nodeState.unreadCount;
      }
    }
  }

  return { totalUnread, unreadChats, chatUnreadCount };
};
