import { isEqual } from 'lodash-es';
import { z } from 'zod';

import { NodeModel, nodeRoleEnum } from './core';

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
  getName: (_, attributes) => {
    if (attributes.type !== 'folder') {
      return undefined;
    }

    return attributes.name;
  },
  getText: () => {
    return undefined;
  },
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
