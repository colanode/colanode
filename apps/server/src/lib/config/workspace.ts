import { z } from 'zod/v4';

export const workspaceConfigSchema = z.object({
  storageLimit: z.string().optional().nullable(),
  maxFileSize: z.string().optional().nullable(),
});

export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;
