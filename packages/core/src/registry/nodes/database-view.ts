import { z } from 'zod/v4';

import { extractNodeRole } from '@colanode/core/lib/nodes';
import { hasNodeRole } from '@colanode/core/lib/permissions';
import { NodeModel } from '@colanode/core/registry/nodes/core';

export const databaseViewFieldAttributesSchema = z.object({
  id: z.string(),
  width: z.number().nullable().optional(),
  display: z.boolean().nullable().optional(),
  index: z.string().nullable().optional(),
});

export type DatabaseViewFieldAttributes = z.infer<
  typeof databaseViewFieldAttributesSchema
>;

export const databaseViewFieldFilterAttributesSchema = z.object({
  id: z.string(),
  fieldId: z.string(),
  type: z.literal('field'),
  operator: z.string(),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .nullable()
    .optional(),
});

export type DatabaseViewFieldFilterAttributes = z.infer<
  typeof databaseViewFieldFilterAttributesSchema
>;

export const databaseViewGroupFilterAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('group'),
  operator: z.enum(['and', 'or']),
  filters: z.array(databaseViewFieldFilterAttributesSchema),
});

export type DatabaseViewGroupFilterAttributes = z.infer<
  typeof databaseViewGroupFilterAttributesSchema
>;

export const databaseViewSortAttributesSchema = z.object({
  id: z.string(),
  fieldId: z.string(),
  direction: z.enum(['asc', 'desc']),
});

export type DatabaseViewSortAttributes = z.infer<
  typeof databaseViewSortAttributesSchema
>;

export const databaseViewFilterAttributesSchema = z.discriminatedUnion('type', [
  databaseViewFieldFilterAttributesSchema,
  databaseViewGroupFilterAttributesSchema,
]);

export type DatabaseViewFilterAttributes = z.infer<
  typeof databaseViewFilterAttributesSchema
>;

export const databaseViewAttributesSchema = z.object({
  type: z.literal('database_view'),
  parentId: z.string(),
  layout: z.enum(['table', 'board', 'calendar']),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  index: z.string(),
  fields: z
    .record(z.string(), databaseViewFieldAttributesSchema)
    .optional()
    .nullable(),
  filters: z
    .record(z.string(), databaseViewFilterAttributesSchema)
    .optional()
    .nullable(),
  sorts: z
    .record(z.string(), databaseViewSortAttributesSchema)
    .optional()
    .nullable(),
  groupBy: z.string().nullable().optional(),
  nameWidth: z.number().nullable().optional(),
});

export type DatabaseViewAttributes = z.infer<
  typeof databaseViewAttributesSchema
>;
export type DatabaseViewLayout = 'table' | 'board' | 'calendar';

export const databaseViewModel: NodeModel = {
  type: 'database_view',
  attributesSchema: databaseViewAttributesSchema,
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
    if (attributes.type !== 'database_view') {
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
