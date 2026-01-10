import { z } from 'zod/v4';

export const workspaceConfigSchema = z
  .object({
    maxFileSize: z.string().optional(),
  })
  .prefault({});

export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;
