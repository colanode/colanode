import { isEqual } from 'lodash-es';
import { z } from 'zod';

import { blockSchema } from './block';
import { CollaborationModel, NodeModel, nodeRoleEnum } from './core';

export const pageAttributesSchema = z.object({
  type: z.literal('page'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  content: z.record(blockSchema),
  collaborators: z.record(z.string(), nodeRoleEnum).nullable().optional(),
});

export type PageAttributes = z.infer<typeof pageAttributesSchema>;

export const pageModel: NodeModel = {
  type: 'page',
  schema: pageAttributesSchema,
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'page') {
      return false;
    }

    const collaboratorIds = Object.keys(attributes.collaborators ?? {});
    if (collaboratorIds.length > 0 && !context.hasAdminAccess()) {
      return false;
    }

    return context.hasEditorAccess();
  },
  canUpdate: async (context, node, attributes) => {
    if (attributes.type !== 'page' || node.type !== 'page') {
      return false;
    }

    if (!isEqual(attributes.collaborators, node.attributes.collaborators)) {
      return context.hasAdminAccess();
    }

    return context.hasEditorAccess();
  },
  canDelete: async (context, _) => {
    return context.hasEditorAccess();
  },
};
export const pageCollaborationAttributesSchema = z.object({
  type: z.literal('page'),
});

export type PageCollaborationAttributes = z.infer<
  typeof pageCollaborationAttributesSchema
>;

export const pageCollaborationModel: CollaborationModel = {
  type: 'page',
  schema: pageCollaborationAttributesSchema,
};
