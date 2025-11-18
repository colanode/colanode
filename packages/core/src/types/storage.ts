import { z } from 'zod/v4';

export const workspaceStorageCounterSchema = z.object({
  count: z.string(),
  size: z.string(),
});

export type WorkspaceStorageCounter = z.infer<
  typeof workspaceStorageCounterSchema
>;

export const workspaceStorageUsageSchema = z.object({
  uploads: workspaceStorageCounterSchema,
  nodes: workspaceStorageCounterSchema,
  documents: workspaceStorageCounterSchema,
});

export type WorkspaceStorageUsage = z.infer<typeof workspaceStorageUsageSchema>;

export const workspaceStorageUserSchema = z.object({
  id: z.string(),
  storageLimit: z.string(),
  maxFileSize: z.string(),
  usage: workspaceStorageUsageSchema,
});

export type WorkspaceStorageUser = z.infer<typeof workspaceStorageUserSchema>;

export const workspaceStorageUsersGetOutputSchema = z.object({
  users: z.array(workspaceStorageUserSchema),
});

export type WorkspaceStorageUsersGetOutput = z.infer<
  typeof workspaceStorageUsersGetOutputSchema
>;

const workspaceUsageSchema = z.object({
  storageLimit: z.string().nullable().optional(),
  maxFileSize: z.string().nullable().optional(),
  usage: workspaceStorageUsageSchema,
});

export const workspaceStorageGetOutputSchema = z.object({
  user: workspaceStorageUserSchema,
  workspace: workspaceUsageSchema.optional(),
});

export type WorkspaceStorageGetOutput = z.infer<
  typeof workspaceStorageGetOutputSchema
>;
