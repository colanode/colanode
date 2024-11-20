import { z } from 'zod';
import { NodeModel } from './core';
import { fieldAttributesSchema } from './fields';
import { isEqual } from 'lodash-es';

export const viewFieldAttributesSchema = z.object({
  id: z.string(),
  width: z.number().nullable().optional(),
  display: z.boolean().nullable().optional(),
  index: z.string().nullable().optional(),
});

export type ViewFieldAttributes = z.infer<typeof viewFieldAttributesSchema>;

export const viewFieldFilterAttributesSchema = z.object({
  id: z.string(),
  fieldId: z.string(),
  type: z.literal('field'),
  operator: z.string(),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .nullable(),
});

export type ViewFieldFilterAttributes = z.infer<
  typeof viewFieldFilterAttributesSchema
>;

export const viewGroupFilterAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('group'),
  operator: z.enum(['and', 'or']),
  filters: z.array(viewFieldFilterAttributesSchema),
});

export type ViewGroupFilterAttributes = z.infer<
  typeof viewGroupFilterAttributesSchema
>;

export const viewSortAttributesSchema = z.object({
  id: z.string(),
  fieldId: z.string(),
  direction: z.enum(['asc', 'desc']),
});

export type ViewSortAttributes = z.infer<typeof viewSortAttributesSchema>;

export const viewFilterAttributesSchema = z.discriminatedUnion('type', [
  viewFieldFilterAttributesSchema,
  viewGroupFilterAttributesSchema,
]);

export type ViewFilterAttributes = z.infer<typeof viewFilterAttributesSchema>;

export const viewAttributesSchema = z.object({
  id: z.string(),
  type: z.enum(['table', 'board', 'calendar']),
  name: z.string(),
  avatar: z.string().nullable(),
  index: z.string(),
  fields: z.record(z.string(), viewFieldAttributesSchema),
  filters: z.record(z.string(), viewFilterAttributesSchema),
  sorts: z.record(z.string(), viewSortAttributesSchema),
  groupBy: z.string().nullable(),
  nameWidth: z.number().nullable().optional(),
});

export type ViewAttributes = z.infer<typeof viewAttributesSchema>;

export const databaseAttributesSchema = z.object({
  type: z.literal('database'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  collaborators: z.record(z.string()).nullable().optional(),
  fields: z.record(z.string(), fieldAttributesSchema),
  views: z.record(z.string(), viewAttributesSchema),
});

export type DatabaseAttributes = z.infer<typeof databaseAttributesSchema>;
export type ViewType = 'table' | 'board' | 'calendar';

export const databaseModel: NodeModel = {
  type: 'database',
  schema: databaseAttributesSchema,
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'database') {
      return false;
    }

    const collaboratorIds = Object.keys(attributes.collaborators ?? {});
    if (collaboratorIds.length > 0 && !context.hasAdminAccess()) {
      return false;
    }

    return context.hasEditorAccess();
  },
  canUpdate: async (context, node, attributes) => {
    if (attributes.type !== 'database' || node.type !== 'database') {
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
