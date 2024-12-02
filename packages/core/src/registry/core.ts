import { z, ZodSchema } from 'zod';

import {
  extractNodeRole,
  hasAdminAccess,
  hasCollaboratorAccess,
  hasEditorAccess,
  hasViewerAccess,
} from '../lib/nodes';
import { WorkspaceRole } from '../types/workspaces';

import { Node, NodeAttributes } from './';

export type NodeRole = 'admin' | 'editor' | 'collaborator' | 'viewer';
export const nodeRoleEnum = z.enum([
  'admin',
  'editor',
  'collaborator',
  'viewer',
]);

export class NodeMutationContext {
  public accountId: string;
  public workspaceId: string;
  public userId: string;
  public ancestors: Node[];
  public nodeRole: NodeRole | null;
  public workspaceRole: WorkspaceRole | null;

  constructor(
    accountId: string,
    workspaceId: string,
    userId: string,
    workspaceRole: WorkspaceRole | null,
    ancestors: Node[]
  ) {
    this.accountId = accountId;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.workspaceRole = workspaceRole;
    this.ancestors = ancestors;
    this.nodeRole = extractNodeRole(ancestors, userId);
  }

  public hasAdminAccess = () => {
    return hasAdminAccess(this.nodeRole);
  };

  public hasEditorAccess = () => {
    return hasEditorAccess(this.nodeRole);
  };

  public hasCollaboratorAccess = () => {
    return hasCollaboratorAccess(this.nodeRole);
  };

  public hasViewerAccess = () => {
    return hasViewerAccess(this.nodeRole);
  };
}

export interface NodeModel {
  type: string;
  schema: ZodSchema;
  canCreate: (
    context: NodeMutationContext,
    attributes: NodeAttributes
  ) => Promise<boolean>;
  canUpdate: (
    context: NodeMutationContext,
    node: Node,
    attributes: NodeAttributes
  ) => Promise<boolean>;
  canDelete: (context: NodeMutationContext, node: Node) => Promise<boolean>;
}

export type CollaborationModel = {
  type: string;
  schema: ZodSchema;
};
