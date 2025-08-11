import { z } from 'zod/v4';

import { fileSubtypeSchema } from '@colanode/core/types/files';

export const workspaceStorageFileSubtypeSchema = z.object({
  subtype: fileSubtypeSchema,
  storageUsed: z.string(),
});

export type WorkspaceStorageFileSubtype = z.infer<
  typeof workspaceStorageFileSubtypeSchema
>;

export const workspaceStorageUserSchema = z.object({
  id: z.string(),
  storageUsed: z.string(),
  storageLimit: z.string(),
  maxFileSize: z.string(),
});

export type WorkspaceStorageUser = z.infer<typeof workspaceStorageUserSchema>;

export const workspaceStorageGetOutputSchema = z.object({
  storageLimit: z.string().nullable().optional(),
  storageUsed: z.string(),
  subtypes: z.array(workspaceStorageFileSubtypeSchema),
  users: z.array(workspaceStorageUserSchema),
});

export type WorkspaceStorageGetOutput = z.infer<
  typeof workspaceStorageGetOutputSchema
>;
