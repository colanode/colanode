export type ChannelReadState = {
  type: 'channel';
  nodeId: string;
  unseenMessagesCount: number;
  mentionsCount: number;
};

export type ChatReadState = {
  type: 'chat';
  nodeId: string;
  unseenMessagesCount: number;
  mentionsCount: number;
};

export type DatabaseReadState = {
  type: 'database';
  nodeId: string;
  unseenRecordsCount: number;
};

export type RecordReadState = {
  type: 'record';
  nodeId: string;
  hasUnseenChanges: boolean;
  mentionsCount: number;
};

export type PageState = {
  type: 'page';
  nodeId: string;
  hasUnseenChanges: boolean;
  mentionsCount: number;
};

export type FolderState = {
  type: 'folder';
  nodeId: string;
  unseenFilesCount: number;
};

export type WorkspaceReadState = {
  importantCount: number;
  hasUnseenChanges: boolean;
};

export type AccountReadState = {
  importantCount: number;
  hasUnseenChanges: boolean;
};

export type WorkspaceRadarData = WorkspaceReadState & {
  userId: string;
  workspaceId: string;
  accountId: string;
  nodeStates: Record<string, NodeReadState>;
};

export type NodeReadState =
  | ChannelReadState
  | ChatReadState
  | DatabaseReadState
  | RecordReadState
  | PageState
  | FolderState;
