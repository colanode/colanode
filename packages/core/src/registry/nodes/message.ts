import { z } from 'zod/v4';

import { extractBlocksMentions } from '@colanode/core/lib/mentions';
import { extractNodeRole } from '@colanode/core/lib/nodes';
import { hasNodeRole } from '@colanode/core/lib/permissions';
import { extractBlockTexts } from '@colanode/core/lib/texts';
import { blockSchema } from '@colanode/core/registry/block';
import { NodeModel } from '@colanode/core/registry/nodes/core';

export const messageAttributesSchema = z.object({
  type: z.literal('message'),
  subtype: z.enum(['standard', 'question', 'answer']),
  name: z.string().optional(),
  parentId: z.string(),
  referenceId: z.string().nullable().optional(),
  content: z.record(z.string(), blockSchema).optional().nullable(),
  selectedContextNodeIds: z.array(z.string()).optional().nullable(),
});

export type MessageAttributes = z.infer<typeof messageAttributesSchema>;

export const messageModel: NodeModel = {
  type: 'message',
  attributesSchema: messageAttributesSchema,
  canCreate: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'collaborator');
  },
  canUpdateAttributes: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return context.node.createdBy === context.user.id;
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

    return (
      context.node.createdBy === context.user.id || hasNodeRole(role, 'admin')
    );
  },
  canReact: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'viewer');
  },
  extractText: (id, attributes) => {
    if (attributes.type !== 'message') {
      throw new Error('Invalid node type');
    }

    const attributesText = extractBlockTexts(id, attributes.content);

    return {
      name: attributes.name,
      attributes: attributesText,
    };
  },
  extractMentions: (id, attributes) => {
    if (attributes.type !== 'message') {
      throw new Error('Invalid node type');
    }

    return extractBlocksMentions(id, attributes.content);
  },
};
