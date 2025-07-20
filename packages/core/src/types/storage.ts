import { z } from 'zod/v4';

import { fileSubtypeSchema } from '@colanode/core/types/files';

export const workspaceStorageFileSubtypeSchema = z.object({
  subtype: fileSubtypeSchema,
  size: z.string(),
});

export type WorkspaceStorageFileSubtype = z.infer<
  typeof workspaceStorageFileSubtypeSchema
>;

export const workspaceStorageUserSchema = z.object({
  id: z.string(),
  used: z.string(),
  limit: z.string(),
});

export type WorkspaceStorageUser = z.infer<typeof workspaceStorageUserSchema>;

export const workspaceStorageGetOutputSchema = z.object({
  limit: z.string().nullable().optional(),
  used: z.string(),
  subtypes: z.array(workspaceStorageFileSubtypeSchema),
  users: z.array(workspaceStorageUserSchema),
});

export type WorkspaceStorageGetOutput = z.infer<
  typeof workspaceStorageGetOutputSchema
>;
