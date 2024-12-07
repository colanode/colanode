import { z } from 'zod';

import { blockSchema } from './block';
import { NodeModel } from './core';
import { fieldValueSchema } from './fields';

import { extractText } from '../lib/blocks';

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
  getName: (_, attributes) => {
    if (attributes.type !== 'record') {
      return undefined;
    }

    return attributes.name;
  },
  getText: (id, attributes) => {
    if (attributes.type !== 'record') {
      return undefined;
    }

    return extractText(id, attributes.content);
  },
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
