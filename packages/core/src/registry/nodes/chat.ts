import { z } from 'zod/v4';

import { hasWorkspaceRole } from '@colanode/core/lib/permissions';
import { NodeModel, nodeRoleEnum } from '@colanode/core/registry/nodes/core';

export const chatAttributesSchema = z.object({
  type: z.literal('chat'),
  collaborators: z.record(z.string(), nodeRoleEnum),
});

export type ChatAttributes = z.infer<typeof chatAttributesSchema>;

export const chatModel: NodeModel = {
  type: 'chat',
  attributesSchema: chatAttributesSchema,
  canCreate: (context) => {
    if (!hasWorkspaceRole(context.user.role, 'guest')) {
      return false;
    }

    if (context.attributes.type !== 'chat') {
      return false;
    }

    const collaborators = context.attributes.collaborators;
    if (Object.keys(collaborators).length !== 2) {
      return false;
    }

    if (!collaborators[context.user.id]) {
      return false;
    }

    return true;
  },
  canUpdateAttributes: () => {
    return false;
  },
  canUpdateDocument: () => {
    return false;
  },
  canDelete: () => {
    return false;
  },
  canReact: () => {
    return false;
  },
  extractText: () => {
    return null;
  },
  extractMentions: () => {
    return [];
  },
};
