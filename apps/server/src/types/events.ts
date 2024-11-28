export type NodeTransactionCreatedEvent = {
  type: 'node_transaction_created';
  transactionId: string;
  nodeId: string;
  workspaceId: string;
};

export type Event = NodeTransactionCreatedEvent;
