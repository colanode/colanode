import { NodeType } from '@colanode/core';

export type NodeTransactionCreatedEvent = {
  type: 'node_transaction_created';
  transactionId: string;
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
};

export type CollaboratorRemovedEvent = {
  type: 'collaborator_removed';
  userId: string;
  nodeId: string;
};

export type Event = NodeTransactionCreatedEvent | CollaboratorRemovedEvent;
