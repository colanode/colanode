import { z } from 'zod';
import { CollaborationModel, NodeModel, nodeRoleEnum } from './core';
import { isEqual } from 'lodash-es';

export const channelAttributesSchema = z.object({
  type: z.literal('channel'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  collaborators: z.record(z.string(), nodeRoleEnum).nullable().optional(),
});

export type ChannelAttributes = z.infer<typeof channelAttributesSchema>;

export const channelModel: NodeModel = {
  type: 'channel',
  schema: channelAttributesSchema,
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'channel') {
      return false;
    }

    if (context.ancestors.length !== 1) {
      return false;
    }

    const parent = context.ancestors[0];
    if (!parent || parent.type !== 'space') {
      return false;
    }

    const collaboratorIds = Object.keys(attributes.collaborators ?? {});
    if (collaboratorIds.length > 0 && !context.hasAdminAccess()) {
      return false;
    }

    return context.hasEditorAccess();
  },
  canUpdate: async (context, node, attributes) => {
    if (attributes.type !== 'channel' || node.type !== 'channel') {
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

export const channelCollaborationAttributesSchema = z.object({
  type: z.literal('channel'),
});

export type ChannelCollaborationAttributes = z.infer<
  typeof channelCollaborationAttributesSchema
>;

export const channelCollaborationModel: CollaborationModel = {
  type: 'channel',
  schema: channelCollaborationAttributesSchema,
};
