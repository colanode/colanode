import { z } from 'zod';

import { CollaborationModel, NodeModel } from './core';

export const workspaceAttributesSchema = z.object({
  type: z.literal('workspace'),
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
});

export type WorkspaceAttributes = z.infer<typeof workspaceAttributesSchema>;

export const workspaceModel: NodeModel = {
  type: 'workspace',
  schema: workspaceAttributesSchema,
  canCreate: async (_, __) => {
    return true;
  },
  canUpdate: async (_, __, ___) => {
    return true;
  },
  canDelete: async (_, __) => {
    return true;
  },
};

export const workspaceCollaborationAttributesSchema = z.object({
  type: z.literal('workspace'),
});

export type WorkspaceCollaborationAttributes = z.infer<
  typeof workspaceCollaborationAttributesSchema
>;

export const workspaceCollaborationModel: CollaborationModel = {
  type: 'workspace',
  schema: workspaceCollaborationAttributesSchema,
};
