import { Node, NodeAttributes } from '@colanode/core';

import { SelectNode, SelectTransaction } from '@/data/schema';

export type NodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: string;
};

export type CreateNodeInput = {
  nodeId: string;
  attributes: NodeAttributes;
  userId: string;
  workspaceId: string;
  ancestors: Node[];
};

export type CreateNodeOutput = {
  node: SelectNode;
  transaction: SelectTransaction;
};

export type UpdateNodeInput = {
  nodeId: string;
  userId: string;
  workspaceId: string;
  updater: (attributes: NodeAttributes) => NodeAttributes | null;
};

export type UpdateNodeOutput = {
  node: SelectNode;
  transaction: SelectTransaction;
};

export type ApplyCreateTransactionInput = {
  id: string;
  nodeId: string;
  data: string | Uint8Array;
  createdAt: Date;
};

export type ApplyCreateTransactionOutput = {
  node: SelectNode;
  transaction: SelectTransaction;
};

export type ApplyUpdateTransactionInput = {
  id: string;
  nodeId: string;
  userId: string;
  data: string | Uint8Array;
  createdAt: Date;
};

export type ApplyUpdateTransactionOutput = {
  node: SelectNode;
  transaction: SelectTransaction;
};

export type ApplyDeleteTransactionInput = {
  id: string;
  nodeId: string;
  createdAt: Date;
};

export type ApplyDeleteTransactionOutput = {
  node: SelectNode;
  transaction: SelectTransaction;
};
