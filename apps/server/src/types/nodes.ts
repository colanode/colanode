import { NodeAttributes } from '@colanode/core';
import { SelectDocumentUpdate, SelectNode } from '@colanode/server/data/schema';

export type NodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: string;
};

export type CreateNodeInput = {
  nodeId: string;
  rootId: string;
  attributes: NodeAttributes;
  userId: string;
  workspaceId: string;
};

export type CreateNodeOutput = {
  node: SelectNode;
};

export type UpdateNodeInput = {
  nodeId: string;
  userId: string;
  workspaceId: string;
  updater: (attributes: NodeAttributes) => NodeAttributes | null;
};

export type UpdateNodeOutput = {
  node: SelectNode;
};

export type DeleteNodeInput = {
  nodeId: string;
  rootId: string;
  deletedAt: string;
};

export type DeleteNodeOutput = {
  node: SelectNode;
};

export type UpdateDocumentOutput = {
  update: SelectDocumentUpdate;
};

export type ConcurrentUpdateResult<T> = {
  type: 'success' | 'error' | 'retry';
  output: T | null;
};
