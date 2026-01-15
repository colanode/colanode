import { z } from 'zod/v4';

import { accountOutputSchema } from '@colanode/core/types/accounts';
import { workspaceOutputSchema } from '@colanode/core/types/workspaces';

export const emailRegisterInputSchema = z.object({
  name: z.string({ error: 'Name is required' }),
  email: z.string({ error: 'Email is required' }).email({
    message: 'Invalid email address',
  }),
  password: z.string({ error: 'Password is required' }),
});

export type EmailRegisterInput = z.infer<typeof emailRegisterInputSchema>;

export const emailLoginInputSchema = z.object({
  email: z.string({ error: 'Email is required' }).email({
    message: 'Invalid email address',
  }),
  password: z.string({ error: 'Password is required' }),
});

export type EmailLoginInput = z.infer<typeof emailLoginInputSchema>;

export const loginSuccessOutputSchema = z.object({
  type: z.literal('success'),
  account: accountOutputSchema,
  workspaces: z.array(workspaceOutputSchema),
  deviceId: z.string(),
  token: z.string(),
});

export type LoginSuccessOutput = z.infer<typeof loginSuccessOutputSchema>;

export const loginVerifyOutputSchema = z.object({
  type: z.literal('verify'),
  id: z.string(),
  expiresAt: z.string(),
});

export type LoginVerifyOutput = z.infer<typeof loginVerifyOutputSchema>;

export const loginOutputSchema = z.discriminatedUnion('type', [
  loginSuccessOutputSchema,
  loginVerifyOutputSchema,
]);

export type LoginOutput = z.infer<typeof loginOutputSchema>;

export const accountSyncOutputSchema = z.object({
  account: accountOutputSchema,
  workspaces: z.array(workspaceOutputSchema),
  token: z.string().optional(),
});

export type AccountSyncOutput = z.infer<typeof accountSyncOutputSchema>;

export const emailVerifyInputSchema = z.object({
  id: z.string(),
  otp: z.string(),
});

export type EmailVerifyInput = z.infer<typeof emailVerifyInputSchema>;

export const emailPasswordResetInitInputSchema = z.object({
  email: z.email(),
});

export type EmailPasswordResetInitInput = z.infer<
  typeof emailPasswordResetInitInputSchema
>;

export const emailPasswordResetCompleteInputSchema = z.object({
  id: z.string(),
  otp: z.string(),
  password: z.string(),
});

export type EmailPasswordResetCompleteInput = z.infer<
  typeof emailPasswordResetCompleteInputSchema
>;

export const emailPasswordResetInitOutputSchema = z.object({
  id: z.string(),
  expiresAt: z.string(),
});

export type EmailPasswordResetInitOutput = z.infer<
  typeof emailPasswordResetInitOutputSchema
>;

export const emailPasswordResetCompleteOutputSchema = z.object({
  success: z.boolean(),
});

export type EmailPasswordResetCompleteOutput = z.infer<
  typeof emailPasswordResetCompleteOutputSchema
>;

export const googleLoginInputSchema = z.object({
  code: z.string(),
});

export type GoogleLoginInput = z.infer<typeof googleLoginInputSchema>;
