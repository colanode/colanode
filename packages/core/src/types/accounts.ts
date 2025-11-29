import { z } from 'zod/v4';

export enum AccountStatus {
  Pending = 0,
  Active = 1,
  Unverified = 2,
}

export const accountOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  avatar: z.string().optional().nullable(),
});

export type AccountOutput = z.infer<typeof accountOutputSchema>;

export const accountUpdateInputSchema = z.object({
  name: z.string(),
  avatar: z.string().nullable().optional(),
});

export type AccountUpdateInput = z.infer<typeof accountUpdateInputSchema>;

export const accountUpdateOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
});

export type AccountUpdateOutput = z.infer<typeof accountUpdateOutputSchema>;
