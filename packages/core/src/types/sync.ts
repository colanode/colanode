import { NodeRole } from '~/registry/core';

export type SyncNodeTransactionsInput = {
  transactions: LocalNodeTransaction[];
};

export type SyncNodeTransactionsOutput = {
  results: SyncNodeTransactionResult[];
};

export type SyncNodeTransactionStatus = 'success' | 'error';

export type SyncNodeTransactionResult = {
  id: string;
  status: SyncNodeTransactionStatus;
};

export type LocalNodeTransaction =
  | LocalCreateNodeTransaction
  | LocalUpdateNodeTransaction
  | LocalDeleteNodeTransaction;

export type LocalCreateNodeTransaction = {
  id: string;
  nodeId: string;
  nodeType: string;
  operation: 'create';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalUpdateNodeTransaction = {
  id: string;
  nodeId: string;
  nodeType: string;
  operation: 'update';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalDeleteNodeTransaction = {
  id: string;
  nodeId: string;
  nodeType: string;
  operation: 'delete';
  createdAt: string;
  createdBy: string;
};

export type ServerNodeCreateTransaction = {
  id: string;
  operation: 'create';
  nodeId: string;
  nodeType: string;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type ServerNodeUpdateTransaction = {
  id: string;
  operation: 'update';
  nodeId: string;
  nodeType: string;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type ServerNodeDeleteTransaction = {
  id: string;
  operation: 'delete';
  nodeId: string;
  nodeType: string;
  workspaceId: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type ServerNodeTransaction =
  | ServerNodeCreateTransaction
  | ServerNodeUpdateTransaction
  | ServerNodeDeleteTransaction;

export type ServerCollaborationRevocation = {
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
