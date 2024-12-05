import { InteractionAttributes } from './interactions';

import { NodeType } from '../registry';
import { NodeRole } from '../registry/core';

export type SyncTransactionsInput = {
  transactions: LocalTransaction[];
};

export type SyncTransactionsOutput = {
  results: SyncTransactionResult[];
};

export type SyncTransactionStatus = 'success' | 'error';

export type SyncTransactionResult = {
  id: string;
  status: SyncTransactionStatus;
};

export type LocalTransaction =
  | LocalCreateTransaction
  | LocalUpdateTransaction
  | LocalDeleteTransaction;

export type LocalCreateTransaction = {
  id: string;
  nodeId: string;
  nodeType: string;
  operation: 'create';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalUpdateTransaction = {
  id: string;
  nodeId: string;
  nodeType: string;
  operation: 'update';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalDeleteTransaction = {
  id: string;
  nodeId: string;
  nodeType: string;
  operation: 'delete';
  createdAt: string;
  createdBy: string;
};

export type ServerCreateTransaction = {
  id: string;
  operation: 'create';
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type ServerUpdateTransaction = {
  id: string;
  operation: 'update';
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type ServerDeleteTransaction = {
  id: string;
  operation: 'delete';
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type ServerTransaction =
  | ServerCreateTransaction
  | ServerUpdateTransaction
  | ServerDeleteTransaction;

export type ServerDeletedCollaboration = {
  userId: string;
  nodeId: string;
  workspaceId: string;
  createdAt: string;
  version: string;
};

export type ServerCollaboration = {
  userId: string;
  nodeId: string;
  workspaceId: string;
  roles: Record<string, NodeRole>;
  createdAt: string;
  updatedAt: string | null;
  version: string;
};

export type ServerInteraction = {
  userId: string;
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
  attributes: InteractionAttributes;
  createdAt: string;
  updatedAt: string | null;
  serverCreatedAt: string;
  serverUpdatedAt: string | null;
  version: string;
};

export type SyncConsumerType =
  | 'transactions'
  | 'collaborations'
  | 'deleted_collaborations'
  | 'interactions';
