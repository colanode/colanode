import { z } from 'zod';
import { CollaborationModel, NodeModel } from './core';
import { fieldValueSchema } from './fields';
import { blockSchema } from './block';

export const recordAttributesSchema = z.object({
  type: z.literal('record'),
  parentId: z.string(),
  databaseId: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  fields: z.record(z.string(), fieldValueSchema),
  content: z.record(blockSchema),
});

export type RecordAttributes = z.infer<typeof recordAttributesSchema>;

export const recordModel: NodeModel = {
  type: 'record',
  schema: recordAttributesSchema,
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'record') {
      return false;
    }

    return context.hasCollaboratorAccess();
  },
  canUpdate: async (context, node, attributes) => {
    if (attributes.type !== 'record' || node.type !== 'record') {
      return false;
    }

    if (node.createdBy === context.userId) {
      return true;
    }

    return context.hasEditorAccess();
  },
  canDelete: async (context, node) => {
    if (node.type !== 'record') {
      return false;
    }

    if (node.createdBy === context.userId) {
      return true;
    }

    return context.hasEditorAccess();
  },
};

export const recordCollaborationAttributesSchema = z.object({
  type: z.literal('record'),
});

export type RecordCollaborationAttributes = z.infer<
  typeof recordCollaborationAttributesSchema
>;

export const recordCollaborationModel: CollaborationModel = {
  type: 'record',
  schema: recordCollaborationAttributesSchema,
};
