import { ServerNodeState, ServerUserNodeState } from './sync';

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
  node: ServerNodeState;
};

export type ServerUserNodeSyncMessage = {
  type: 'server_user_node_sync';
  userNode: ServerUserNodeState;
};

export type Message =
  | LocalNodeDeleteMessage
  | LocalNodeSyncMessage
  | LocalUserNodeSyncMessage
  | ServerNodeDeleteMessage
  | ServerNodeSyncMessage
  | ServerUserNodeSyncMessage;
