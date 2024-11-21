import { NodeRole } from '@colanode/core';

export type NodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: NodeRole;
};

export type UserNode = {
  userId: string;
  nodeId: string;
  lastSeenAt: string | null;
  lastSeenVersionId: string | null;
  mentionsCount: number;
  attributes: string | null;
  versionId: string;
  createdAt: string;
  updatedAt: string | null;
};

export type Download = {
  nodeId: string;
  uploadId: string;
  createdAt: string;
  updatedAt: string | null;
  progress: number;
  retryCount: number;
};

export type Upload = {
  nodeId: string;
  createdAt: string;
  updatedAt: string | null;
  progress: number;
  retryCount: number;
};
