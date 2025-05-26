import { NodeAttributes } from '@colanode/core';

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

export type UpdateNodeInput = {
  nodeId: string;
  userId: string;
  workspaceId: string;
  updater: (attributes: NodeAttributes) => NodeAttributes | null;
};

export type ConcurrentUpdateResult<T> =
  | { type: 'success'; output: T }
  | { type: 'error'; error: string }
  | { type: 'retry' };
