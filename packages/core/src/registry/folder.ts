import { isEqual } from 'lodash-es';
import { z } from 'zod';

import { CollaborationModel, NodeModel, nodeRoleEnum } from './core';

export const folderAttributesSchema = z.object({
  type: z.literal('folder'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  collaborators: z.record(z.string(), nodeRoleEnum).nullable().optional(),
});

export type FolderAttributes = z.infer<typeof folderAttributesSchema>;

export const folderModel: NodeModel = {
  type: 'folder',
  schema: folderAttributesSchema,
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'folder') {
      return false;
    }

    const collaboratorIds = Object.keys(attributes.collaborators ?? {});
    if (collaboratorIds.length > 0 && !context.hasAdminAccess()) {
      return false;
    }

    return context.hasEditorAccess();
  },
  canUpdate: async (context, node, attributes) => {
    if (attributes.type !== 'folder' || node.type !== 'folder') {
      return false;
    }

    if (!isEqual(node.attributes.collaborators, attributes.collaborators)) {
      return context.hasAdminAccess();
    }

    return context.hasEditorAccess();
  },
  canDelete: async (context, _) => {
    return context.hasEditorAccess();
  },
};

export const folderCollaborationAttributesSchema = z.object({
  type: z.literal('folder'),
});

export type FolderCollaborationAttributes = z.infer<
  typeof folderCollaborationAttributesSchema
>;

export const folderCollaborationModel: CollaborationModel = {
  type: 'folder',
  schema: folderCollaborationAttributesSchema,
};
