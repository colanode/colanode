import { ServerCollaboration, ServerNodeTransaction } from './sync';

export type FetchNodeTransactionsMessage = {
  type: 'fetch_node_transactions';
  userId: string;
  workspaceId: string;
  cursor: string | null;
};

export type FetchCollaborationsMessage = {
  type: 'fetch_collaborations';
  userId: string;
  workspaceId: string;
  cursor: string | null;
};

export type NodeTransactionsBatchMessage = {
  type: 'node_transactions_batch';
  userId: string;
  transactions: ServerNodeTransaction[];
};

export type CollaborationsBatchMessage = {
  type: 'collaborations_batch';
  userId: string;
  collaborations: ServerCollaboration[];
};

export type Message =
  | FetchNodeTransactionsMessage
  | NodeTransactionsBatchMessage
  | FetchCollaborationsMessage
  | CollaborationsBatchMessage;
