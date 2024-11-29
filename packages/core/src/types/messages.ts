import { NodeType } from '~/registry';
import {
  ServerInteraction,
  ServerCollaboration,
  ServerCollaborationRevocation,
  ServerNodeTransaction,
} from './sync';
import { InteractionEvent } from './interactions';

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

export type FetchInteractionsMessage = {
  type: 'fetch_interactions';
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

export type InteractionsBatchMessage = {
  type: 'interactions_batch';
  userId: string;
  interactions: ServerInteraction[];
};

export type SyncInteractionsMessage = {
  type: 'sync_interactions';
  userId: string;
  nodeId: string;
  nodeType: NodeType;
  events: InteractionEvent[];
};

export type Message =
  | FetchNodeTransactionsMessage
  | NodeTransactionsBatchMessage
  | FetchCollaborationRevocationsMessage
  | CollaborationRevocationsBatchMessage
  | FetchCollaborationsMessage
  | CollaborationsBatchMessage
  | FetchInteractionsMessage
  | InteractionsBatchMessage
  | SyncInteractionsMessage;
