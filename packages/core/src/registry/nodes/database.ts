import { z } from 'zod/v4';

import { DEFAULT_PAGE_META_TYPE_NAME } from '@colanode/core/lib/meta-types';
import { extractNodeRole } from '@colanode/core/lib/nodes';
import { hasNodeRole } from '@colanode/core/lib/permissions';
import { NodeModel } from '@colanode/core/registry/nodes/core';
import { fieldAttributesSchema } from '@colanode/core/registry/nodes/field';

export const databaseNameFieldAttributesSchema = z.object({
  name: z.string().nullable().optional(),
});

export type DatabaseNameFieldAttributes = z.infer<
  typeof databaseNameFieldAttributesSchema
>;

export const databasePurposeSchema = z.enum(['records', 'meta_type']);

export type DatabasePurpose = z.infer<typeof databasePurposeSchema>;

export const databaseAttributesSchema = z.object({
  type: z.literal('database'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  purpose: databasePurposeSchema.default('records'),
  fields: z.record(z.string(), fieldAttributesSchema),
  nameField: databaseNameFieldAttributesSchema.nullable().optional(),
  locked: z.boolean().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

export type DatabaseAttributes = z.infer<typeof databaseAttributesSchema>;

export const databaseModel: NodeModel = {
  type: 'database',
  attributesSchema: databaseAttributesSchema,
  canCreate: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
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

    return hasNodeRole(role, 'editor');
  },
  canUpdateDocument: () => {
    return false;
  },
  canDelete: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    if (context.node.type === 'database') {
      const purpose = context.node.purpose ?? 'records';
      if (
        purpose === 'meta_type' &&
        context.node.name === DEFAULT_PAGE_META_TYPE_NAME
      ) {
        return false;
      }
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'editor');
  },
  canReact: () => {
    return false;
  },
  extractText: (_, attributes) => {
    if (attributes.type !== 'database') {
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
