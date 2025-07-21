import { z } from 'zod/v4';

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

export const userCreateInputSchema = z.object({
  email: z.string().email(),
  role: workspaceRoleSchema,
});

export type UserCreateInput = z.infer<typeof userCreateInputSchema>;

export const usersCreateInputSchema = z.object({
  users: z.array(userCreateInputSchema),
});

export type UsersCreateInput = z.infer<typeof usersCreateInputSchema>;

export const userOutputSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  role: workspaceRoleSchema,
  customName: z.string().nullable().optional(),
  customAvatar: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  revision: z.string(),
  status: z.enum(UserStatus),
});

export type UserOutput = z.infer<typeof userOutputSchema>;

export const userCreateErrorOutputSchema = z.object({
  email: z.email(),
  error: z.string(),
});

export type UserCreateErrorOutput = z.infer<typeof userCreateErrorOutputSchema>;

export const usersCreateOutputSchema = z.object({
  users: z.array(userOutputSchema),
  errors: z.array(userCreateErrorOutputSchema),
});

export type UsersCreateOutput = z.infer<typeof usersCreateOutputSchema>;

export const userRoleUpdateInputSchema = z.object({
  role: workspaceRoleSchema,
});

export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateInputSchema>;

export const userStorageUpdateInputSchema = z.object({
  limit: z.string(),
});

export type UserStorageUpdateInput = z.infer<
  typeof userStorageUpdateInputSchema
>;
