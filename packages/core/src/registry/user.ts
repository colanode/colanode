import { z } from 'zod';

import { CollaborationModel, NodeModel } from './core';

export const userAttributesSchema = z.object({
  type: z.literal('user'),
  name: z.string(),
  parentId: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable().optional(),
  accountId: z.string(),
  role: z.enum(['owner', 'admin', 'collaborator', 'guest', 'none']),
});

export type UserAttributes = z.infer<typeof userAttributesSchema>;

export const userModel: NodeModel = {
  type: 'user',
  schema: userAttributesSchema,
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

export const userCollaborationAttributesSchema = z.object({
  type: z.literal('user'),
});

export type UserCollaborationAttributes = z.infer<
  typeof userCollaborationAttributesSchema
>;

export const userCollaborationModel: CollaborationModel = {
  type: 'user',
  schema: userCollaborationAttributesSchema,
};
