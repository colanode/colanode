import {
  ServerCollaboration,
  ServerCollaborationRevocation,
  ServerNodeTransaction,
} from './sync';

export type FetchNodeTransactionsMessage = {
  type: 'fetch_node_transactions';
  userId: string;
  workspaceId: string;
  cursor: string;
};

export type FetchCollaborationRevocationsMessage = {
  type: 'fetch_collaboration_revocations';
  userId: string;
  workspaceId: string;
  cursor: string;
};

export type FetchCollaborationsMessage = {
  type: 'fetch_collaborations';
  userId: string;
  workspaceId: string;
  cursor: string;
};

export type NodeTransactionsBatchMessage = {
  type: 'node_transactions_batch';
  userId: string;
  transactions: ServerNodeTransaction[];
};

export type CollaborationRevocationsBatchMessage = {
  type: 'collaboration_revocations_batch';
  userId: string;
  revocations: ServerCollaborationRevocation[];
};

export type CollaborationsBatchMessage = {
  type: 'collaborations_batch';
  userId: string;
  collaborations: ServerCollaboration[];
};

export type Message =
  | FetchNodeTransactionsMessage
  | NodeTransactionsBatchMessage
  | FetchCollaborationRevocationsMessage
  | CollaborationRevocationsBatchMessage
  | FetchCollaborationsMessage
  | CollaborationsBatchMessage;
