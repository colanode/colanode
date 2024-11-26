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
  type: 'create';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalUpdateNodeTransaction = {
  id: string;
  nodeId: string;
  type: 'update';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalDeleteNodeTransaction = {
  id: string;
  nodeId: string;
  type: 'delete';
  createdAt: string;
  createdBy: string;
};

export type ServerNodeCreateTransaction = {
  id: string;
  type: 'create';
  nodeId: string;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  number: string;
};

export type ServerNodeUpdateTransaction = {
  id: string;
  type: 'update';
  nodeId: string;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  number: string;
};

export type ServerNodeDeleteTransaction = {
  id: string;
  type: 'delete';
  nodeId: string;
  workspaceId: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  number: string;
};

export type ServerNodeTransaction =
  | ServerNodeCreateTransaction
  | ServerNodeUpdateTransaction
  | ServerNodeDeleteTransaction;

export type ServerCollaboration = {
  userId: string;
  nodeId: string;
  type: string;
  workspaceId: string;
  state: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  number: string;
};
