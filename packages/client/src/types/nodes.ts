import {
  NodeRole,
  ChannelNode,
  FolderNode,
  FileNode,
  DatabaseViewNode,
  DatabaseNode,
  ChatNode,
  PageNode,
  SpaceNode,
  MessageNode,
  RecordNode,
} from '@colanode/core';

export type NodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: NodeRole;
};

export type NodeInteraction = {
  nodeId: string;
  collaboratorId: string;
  rootId: string;
  revision: string;
  lastSeenAt: string | null;
  firstSeenAt: string | null;
  lastOpenedAt: string | null;
  firstOpenedAt: string | null;
};

export type NodeReaction = {
  nodeId: string;
  collaboratorId: string;
  rootId: string;
  reaction: string;
  createdAt: string;
};

export type NodeReactionCount = {
  reaction: string;
  count: number;
  reacted: boolean;
};

export type NodeReference = {
  nodeId: string;
  referenceId: string;
  innerId: string;
  type: string;
};

export type NodeCounterType =
  | 'unread_mentions'
  | 'unread_messages'
  | 'unread_important_messages';

export type NodeCounter = {
  nodeId: string;
  type: NodeCounterType;
  count: number;
};

export type LocalNodeBase = {
  localRevision: string;
  serverRevision: string;
};

export type LocalChannelNode = ChannelNode & LocalNodeBase;

export type LocalChatNode = ChatNode & LocalNodeBase;

export type LocalPageNode = PageNode & LocalNodeBase;

export type LocalDatabaseNode = DatabaseNode & LocalNodeBase;

export type LocalDatabaseViewNode = DatabaseViewNode & LocalNodeBase;

export type LocalFileNode = FileNode & LocalNodeBase;

export type LocalFolderNode = FolderNode & LocalNodeBase;

export type LocalRecordNode = RecordNode & LocalNodeBase;

export type LocalMessageNode = MessageNode & LocalNodeBase;

export type LocalSpaceNode = SpaceNode & LocalNodeBase;

export type LocalNode =
  | LocalChannelNode
  | LocalChatNode
  | LocalDatabaseNode
  | LocalDatabaseViewNode
  | LocalFileNode
  | LocalFolderNode
  | LocalPageNode
  | LocalRecordNode
  | LocalMessageNode
  | LocalSpaceNode;
