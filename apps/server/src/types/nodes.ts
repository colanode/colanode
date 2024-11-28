import { SelectNode, SelectNodeTransaction } from '@/data/schema';
import { Node, NodeAttributes } from '@colanode/core';

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
  transaction: SelectNodeTransaction;
};

export type UpdateNodeInput = {
  nodeId: string;
  userId: string;
  workspaceId: string;
  updater: (attributes: NodeAttributes) => NodeAttributes | null;
};

export type UpdateNodeOutput = {
  node: SelectNode;
  transaction: SelectNodeTransaction;
};

export type ApplyNodeCreateTransactionInput = {
  id: string;
  nodeId: string;
  data: string | Uint8Array;
  createdAt: Date;
};

export type ApplyNodeCreateTransactionOutput = {
  node: SelectNode;
  transaction: SelectNodeTransaction;
};

export type ApplyNodeUpdateTransactionInput = {
  id: string;
  nodeId: string;
  userId: string;
  data: string | Uint8Array;
  createdAt: Date;
};

export type ApplyNodeUpdateTransactionOutput = {
  node: SelectNode;
  transaction: SelectNodeTransaction;
};

export type ApplyNodeDeleteTransactionInput = {
  id: string;
  nodeId: string;
  createdAt: Date;
};

export type ApplyNodeDeleteTransactionOutput = {
  node: SelectNode;
  transaction: SelectNodeTransaction;
};
