export type UnreadState = {
  hasUnread: boolean;
  unreadCount: number;
};

export type WorkspaceRadarData = {
  userId: string;
  workspaceId: string;
  accountId: string;
  state: UnreadState;
  nodeStates: Record<string, UnreadState>;
};
