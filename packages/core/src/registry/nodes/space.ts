import { z } from 'zod/v4';

import { extractNodeRole } from '@colanode/core/lib/nodes';
import { hasNodeRole, hasWorkspaceRole } from '@colanode/core/lib/permissions';
import { NodeModel, nodeRoleEnum } from '@colanode/core/registry/nodes/core';

export const spaceAttributesSchema = z.object({
  type: z.literal('space'),
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  collaborators: z.record(z.string(), nodeRoleEnum),
  visibility: z.enum(['public', 'private']).default('private'),
});

export type SpaceAttributes = z.infer<typeof spaceAttributesSchema>;

export const spaceModel: NodeModel = {
  type: 'space',
  attributesSchema: spaceAttributesSchema,
  canCreate: (context) => {
    if (context.tree.length > 0) {
      return false;
    }

    if (!hasWorkspaceRole(context.user.role, 'collaborator')) {
      return false;
    }

    if (context.attributes.type !== 'space') {
      return false;
    }

    const collaborators = context.attributes.collaborators;
    if (Object.keys(collaborators).length === 0) {
      return false;
    }

    if (collaborators[context.user.id] !== 'admin') {
      return false;
    }

    return true;
  },
  canUpdateAttributes: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'admin');
  },
  canUpdateDocument: () => {
    return false;
  },
  canDelete: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'admin');
  },
  canReact: () => {
    return false;
  },
  extractText: (_, attributes) => {
    if (attributes.type !== 'space') {
      throw new Error('Invalid node type');
    }

    return {
      name: attributes.name,
      attributes: null,
    };
  },
  extractMentions: () => {
    return [];
  },
};
