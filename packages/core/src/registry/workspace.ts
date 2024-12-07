import { z } from 'zod';

import { NodeModel } from './core';

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
  getName: () => {
    return undefined;
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
