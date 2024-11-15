export type LocalNodeDeleteMessage = {
  type: 'local_node_delete';
  nodeId: string;
  workspaceId: string;
};

export type LocalNodeSyncMessage = {
  type: 'local_node_sync';
  nodeId: string;
  userId: string;
  versionId: string;
  workspaceId: string;
};

export type LocalUserNodeSyncMessage = {
  type: 'local_user_node_sync';
  nodeId: string;
  userId: string;
  workspaceId: string;
  versionId: string;
};

export type ServerNodeDeleteMessage = {
  type: 'server_node_delete';
  id: string;
  workspaceId: string;
};

export type ServerNodeSyncMessage = {
  type: 'server_node_sync';
  id: string;
  workspaceId: string;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  serverCreatedAt: string;
  serverUpdatedAt: string | null;
  versionId: string;
};

export type ServerUserNodeSyncMessage = {
  type: 'server_user_node_sync';
  nodeId: string;
  userId: string;
  workspaceId: string;
  versionId: string;
  lastSeenAt: string | null;
  lastSeenVersionId: string | null;
  mentionsCount: number;
  createdAt: string;
  updatedAt: string | null;
};

export type Message =
  | LocalNodeDeleteMessage
  | LocalNodeSyncMessage
  | LocalUserNodeSyncMessage
  | ServerNodeDeleteMessage
  | ServerNodeSyncMessage
  | ServerUserNodeSyncMessage;