import { z } from 'zod';

export const syncMutationStatusSchema = z.enum(['success', 'error']);

export type SyncMutationStatus = z.infer<typeof syncMutationStatusSchema>;

export const syncMutationResultSchema = z.object({
  id: z.string(),
  status: syncMutationStatusSchema,
});

export type SyncMutationResult = z.infer<typeof syncMutationResultSchema>;

export const syncMutationsInputSchema = z.object({
  mutations: z.array(z.lazy(() => mutationSchema)),
});

export type SyncMutationsInput = z.infer<typeof syncMutationsInputSchema>;

export const syncMutationsOutputSchema = z.object({
  results: z.array(syncMutationResultSchema),
});

export type SyncMutationsOutput = z.infer<typeof syncMutationsOutputSchema>;

export const mutationBaseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
});

export type MutationBase = z.infer<typeof mutationBaseSchema>;

export const createNodeMutationDataSchema = z.object({
  nodeId: z.string(),
  updateId: z.string(),
  createdAt: z.string(),
  data: z.string(),
});

export type CreateNodeMutationData = z.infer<
  typeof createNodeMutationDataSchema
>;

export const createNodeMutationSchema = mutationBaseSchema.extend({
  type: z.literal('create_node'),
  data: createNodeMutationDataSchema,
});

export type CreateNodeMutation = z.infer<typeof createNodeMutationSchema>;

export const updateNodeMutationDataSchema = z.object({
  nodeId: z.string(),
  updateId: z.string(),
  data: z.string(),
  createdAt: z.string(),
});

export type UpdateNodeMutationData = z.infer<
  typeof updateNodeMutationDataSchema
>;

export const updateNodeMutationSchema = mutationBaseSchema.extend({
  type: z.literal('update_node'),
  data: updateNodeMutationDataSchema,
});

export type UpdateNodeMutation = z.infer<typeof updateNodeMutationSchema>;

export const deleteNodeMutationDataSchema = z.object({
  nodeId: z.string(),
  rootId: z.string(),
  deletedAt: z.string(),
});

export type DeleteNodeMutationData = z.infer<
  typeof deleteNodeMutationDataSchema
>;

export const deleteNodeMutationSchema = mutationBaseSchema.extend({
  type: z.literal('delete_node'),
  data: deleteNodeMutationDataSchema,
});

export type DeleteNodeMutation = z.infer<typeof deleteNodeMutationSchema>;

export const createNodeReactionMutationDataSchema = z.object({
  nodeId: z.string(),
  reaction: z.string(),
  rootId: z.string(),
  createdAt: z.string(),
});

export type CreateNodeReactionMutationData = z.infer<
  typeof createNodeReactionMutationDataSchema
>;

export const createNodeReactionMutationSchema = mutationBaseSchema.extend({
  type: z.literal('create_node_reaction'),
  data: createNodeReactionMutationDataSchema,
});

export type CreateNodeReactionMutation = z.infer<
  typeof createNodeReactionMutationSchema
>;

export const deleteNodeReactionMutationDataSchema = z.object({
  nodeId: z.string(),
  reaction: z.string(),
  rootId: z.string(),
  deletedAt: z.string(),
});

export type DeleteNodeReactionMutationData = z.infer<
  typeof deleteNodeReactionMutationDataSchema
>;

export const deleteNodeReactionMutationSchema = mutationBaseSchema.extend({
  type: z.literal('delete_node_reaction'),
  data: deleteNodeReactionMutationDataSchema,
});

export type DeleteNodeReactionMutation = z.infer<
  typeof deleteNodeReactionMutationSchema
>;

export const markNodeSeenMutationDataSchema = z.object({
  nodeId: z.string(),
  collaboratorId: z.string(),
  seenAt: z.string(),
});

export type MarkNodeSeenMutationData = z.infer<
  typeof markNodeSeenMutationDataSchema
>;

export const markNodeSeenMutationSchema = mutationBaseSchema.extend({
  type: z.literal('mark_node_seen'),
  data: markNodeSeenMutationDataSchema,
});

export type MarkNodeSeenMutation = z.infer<typeof markNodeSeenMutationSchema>;

export const markNodeOpenedMutationDataSchema = z.object({
  nodeId: z.string(),
  collaboratorId: z.string(),
  openedAt: z.string(),
});

export type MarkNodeOpenedMutationData = z.infer<
  typeof markNodeOpenedMutationDataSchema
>;

export const markNodeOpenedMutationSchema = mutationBaseSchema.extend({
  type: z.literal('mark_node_opened'),
  data: markNodeOpenedMutationDataSchema,
});

export type MarkNodeOpenedMutation = z.infer<
  typeof markNodeOpenedMutationSchema
>;

export const updateDocumentMutationDataSchema = z.object({
  documentId: z.string(),
  updateId: z.string(),
  data: z.string(),
  createdAt: z.string(),
});

export type UpdateDocumentMutationData = z.infer<
  typeof updateDocumentMutationDataSchema
>;

export const updateDocumentMutationSchema = mutationBaseSchema.extend({
  type: z.literal('update_document'),
  data: updateDocumentMutationDataSchema,
});

export type UpdateDocumentMutation = z.infer<
  typeof updateDocumentMutationSchema
>;

export const mutationSchema = z.discriminatedUnion('type', [
  createNodeMutationSchema,
  updateNodeMutationSchema,
  deleteNodeMutationSchema,
  createNodeReactionMutationSchema,
  deleteNodeReactionMutationSchema,
  markNodeSeenMutationSchema,
  markNodeOpenedMutationSchema,
  updateDocumentMutationSchema,
]);

export type Mutation = z.infer<typeof mutationSchema>;
export type MutationType = Mutation['type'];
