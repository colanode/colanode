import { z } from 'zod/v4';

import { extractNodeRole } from '@colanode/core/lib/nodes';
import { hasNodeRole } from '@colanode/core/lib/permissions';
import { NodeModel } from '@colanode/core/registry/nodes/core';

export const fileAttributesSchema = z.object({
  type: z.literal('file'),
  subtype: z.string(),
  parentId: z.string(),
  index: z.string().optional(),
  name: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  extension: z.string(),
  size: z.number(),
  version: z.string(),
  status: z.number(),
});

export type FileAttributes = z.infer<typeof fileAttributesSchema>;

export const fileModel: NodeModel = {
  type: 'file',
  attributesSchema: fileAttributesSchema,
  canCreate: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    const parent = context.tree[context.tree.length - 1]!;
    if (parent.type === 'message') {
      return hasNodeRole(role, 'collaborator');
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateAttributes: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    const parent = context.tree[context.tree.length - 1]!;
    if (parent.type === 'message') {
      return parent.createdBy === context.user.id || hasNodeRole(role, 'admin');
    }

    return hasNodeRole(role, 'editor');
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

    const parent = context.tree[context.tree.length - 1]!;
    if (parent.type === 'message') {
      return parent.createdBy === context.user.id || hasNodeRole(role, 'admin');
    }

    return hasNodeRole(role, 'editor');
  },
  canReact: () => {
    return false;
  },
  extractText: (_, attributes) => {
    if (attributes.type !== 'file') {
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
