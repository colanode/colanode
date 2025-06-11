import { z } from 'zod/v4';

export enum MutationStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  METHOD_NOT_ALLOWED = 405,
  INTERNAL_SERVER_ERROR = 500,
}

export const mutationStatusSchema = z.enum(MutationStatus);

export const syncMutationResultSchema = z.object({
  id: z.string(),
  status: mutationStatusSchema,
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
  type: z.literal('node.create'),
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
  type: z.literal('node.update'),
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
  type: z.literal('node.delete'),
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
  type: z.literal('node.reaction.create'),
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
  type: z.literal('node.reaction.delete'),
  data: deleteNodeReactionMutationDataSchema,
});

export type DeleteNodeReactionMutation = z.infer<
  typeof deleteNodeReactionMutationSchema
>;

export const nodeInteractionSeenMutationDataSchema = z.object({
  nodeId: z.string(),
  collaboratorId: z.string(),
  seenAt: z.string(),
});

export type NodeInteractionSeenMutationData = z.infer<
  typeof nodeInteractionSeenMutationDataSchema
>;

export const nodeInteractionSeenMutationSchema = mutationBaseSchema.extend({
  type: z.literal('node.interaction.seen'),
  data: nodeInteractionSeenMutationDataSchema,
});

export type NodeInteractionSeenMutation = z.infer<
  typeof nodeInteractionSeenMutationSchema
>;

export const nodeInteractionOpenedMutationDataSchema = z.object({
  nodeId: z.string(),
  collaboratorId: z.string(),
  openedAt: z.string(),
});

export type NodeInteractionOpenedMutationData = z.infer<
  typeof nodeInteractionOpenedMutationDataSchema
>;

export const nodeInteractionOpenedMutationSchema = mutationBaseSchema.extend({
  type: z.literal('node.interaction.opened'),
  data: nodeInteractionOpenedMutationDataSchema,
});

export type NodeInteractionOpenedMutation = z.infer<
  typeof nodeInteractionOpenedMutationSchema
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
  type: z.literal('document.update'),
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
  nodeInteractionSeenMutationSchema,
  nodeInteractionOpenedMutationSchema,
  updateDocumentMutationSchema,
]);

export type Mutation = z.infer<typeof mutationSchema>;
export type MutationType = Mutation['type'];
