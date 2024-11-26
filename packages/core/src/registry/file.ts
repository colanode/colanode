import { z } from 'zod';
import { CollaborationModel, NodeModel } from './core';

export const fileAttributesSchema = z.object({
  type: z.literal('file'),
  subtype: z.enum(['image', 'video', 'audio', 'document', 'other']),
  name: z.string(),
  parentId: z.string(),
  mimeType: z.string(),
  size: z.number(),
  extension: z.string(),
  fileName: z.string(),
  uploadStatus: z
    .enum(['pending', 'completed', 'failed', 'no_space'])
    .default('pending'),
  uploadId: z.string(),
});

export type FileAttributes = z.infer<typeof fileAttributesSchema>;

export const fileModel: NodeModel = {
  type: 'file',
  schema: fileAttributesSchema,
  canCreate: async (_, __) => {
    return true;
  },
  canUpdate: async (_, __, ___) => {
    return true;
  },
  canDelete: async (_, __) => {
    return true;
  },
};

export const fileCollaborationAttributesSchema = z.object({
  type: z.literal('file'),
});

export type FileCollaborationAttributes = z.infer<
  typeof fileCollaborationAttributesSchema
>;

export const fileCollaborationModel: CollaborationModel = {
  type: 'file',
  schema: fileCollaborationAttributesSchema,
};
