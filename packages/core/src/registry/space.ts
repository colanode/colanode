import { z } from 'zod';

import { NodeModel, nodeRoleEnum } from './core';

export const spaceAttributesSchema = z.object({
  type: z.literal('space'),
  name: z.string(),
  parentId: z.string(),
  description: z.string().nullable(),
  avatar: z.string().nullable().optional(),
  collaborators: z.record(z.string(), nodeRoleEnum),
});

export type SpaceAttributes = z.infer<typeof spaceAttributesSchema>;

export const spaceModel: NodeModel = {
  type: 'space',
  schema: spaceAttributesSchema,
  getName: (_, attributes) => {
    if (attributes.type !== 'space') {
      return undefined;
    }

    return attributes.name;
  },
  getText: () => {
    return undefined;
  },
  canCreate: async (context, __) => {
    if (context.workspaceRole === 'guest' || context.workspaceRole === 'none') {
      return false;
    }

    return true;
  },
  canUpdate: async (context, _, __) => {
    return context.hasAdminAccess();
  },
  canDelete: async (context, _) => {
    return context.hasAdminAccess();
  },
};
