import { NodeAttributes } from '../registry';

export type NodeOutput = {
  id: string;
  workspaceId: string;
  parentId: string;
  type: string;
  attributes: NodeAttributes;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  versionId: string;
  serverCreatedAt: string;
  serverUpdatedAt?: string | null;
};
