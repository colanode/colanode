export type NodeTransactionCreatedEvent = {
  type: 'node_transaction_created';
  transactionId: string;
  nodeId: string;
  workspaceId: string;
};

export type CollaborationCreatedEvent = {
  type: 'collaboration_created';
  userId: string;
  nodeId: string;
  workspaceId: string;
};

export type CollaborationUpdatedEvent = {
  type: 'collaboration_updated';
  userId: string;
  nodeId: string;
  workspaceId: string;
};

export type Event =
  | NodeTransactionCreatedEvent
  | CollaborationCreatedEvent
  | CollaborationUpdatedEvent;
