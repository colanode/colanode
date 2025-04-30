import { z } from 'zod';

export enum WorkspaceStatus {
  Active = 1,
  Inactive = 2,
}

export enum UserStatus {
  Active = 1,
  Removed = 2,
}

export const workspaceRoleSchema = z.enum([
  'owner',
  'admin',
  'collaborator',
  'guest',
  'none',
]);

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

export const workspaceCreateInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

export type WorkspaceCreateInput = z.infer<typeof workspaceCreateInputSchema>;

export const workspaceUserOutputSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  role: workspaceRoleSchema,
  storageLimit: z.string(),
  maxFileSize: z.string(),
});

export type WorkspaceUserOutput = z.infer<typeof workspaceUserOutputSchema>;

export const workspaceOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  user: workspaceUserOutputSchema,
});

export type WorkspaceOutput = z.infer<typeof workspaceOutputSchema>;

export const workspaceUpdateInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateInputSchema>;

export const usersInviteInputSchema = z.object({
  emails: z.array(z.string().email()),
  role: workspaceRoleSchema,
});

export type UsersInviteInput = z.infer<typeof usersInviteInputSchema>;

export const userInviteResultSchema = z.object({
  email: z.string().email(),
  result: z.enum(['success', 'error', 'exists']),
});

export type UserInviteResult = z.infer<typeof userInviteResultSchema>;

export const usersInviteOutputSchema = z.object({
  results: z.array(userInviteResultSchema),
});

export type UsersInviteOutput = z.infer<typeof usersInviteOutputSchema>;

export const userRoleUpdateInputSchema = z.object({
  role: workspaceRoleSchema,
});

export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateInputSchema>;
