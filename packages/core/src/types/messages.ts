import { InteractionEvent } from './interactions';
import {
  ServerCollaboration,
  ServerCollaborationRevocation,
  ServerInteraction,
  ServerNodeTransaction,
  SyncConsumerType,
} from './sync';

import { NodeType } from '../registry';

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

export type InitSyncConsumerMessage = {
  type: 'init_sync_consumer';
  userId: string;
  consumerType: SyncConsumerType;
  cursor: string;
};

export type Message =
  | NodeTransactionsBatchMessage
  | CollaborationRevocationsBatchMessage
  | CollaborationsBatchMessage
  | InteractionsBatchMessage
  | SyncInteractionsMessage
  | InitSyncConsumerMessage;
