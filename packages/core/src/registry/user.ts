import { z } from 'zod';

import { NodeModel } from './core';

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
  getName: (_, attributes) => {
    if (attributes.type !== 'user') {
      return undefined;
    }

    return attributes.name;
  },
  getText: () => {
    return undefined;
  },
  canCreate: async (_, __) => {
    return false;
  },
  canUpdate: async (_, __, ___) => {
    return false;
  },
  canDelete: async (_, __) => {
    return false;
  },
};
