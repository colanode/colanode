import { z } from 'zod';

export const accountVerificationTypeSchema = z.enum([
  'automatic',
  'manual',
  'email',
]);
export type AccountVerificationType = z.infer<
  typeof accountVerificationTypeSchema
>;

export const accountConfigSchema = z.object({
  verificationType: accountVerificationTypeSchema.default('manual'),
  otpTimeout: z.coerce.number().default(600),
  allowGoogleLogin: z.boolean().default(false),
});

export type AccountConfig = z.infer<typeof accountConfigSchema>;

export const readAccountConfigVariables = () => {
  return {
    verificationType: process.env.ACCOUNT_VERIFICATION_TYPE,
    otpTimeout: process.env.ACCOUNT_OTP_TIMEOUT,
    allowGoogleLogin: process.env.ACCOUNT_ALLOW_GOOGLE_LOGIN === 'true',
  };
};
