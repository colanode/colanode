import { z } from 'zod/v4';

export const accountVerificationTypeSchema = z.enum([
  'automatic',
  'manual',
  'email',
]);

export type AccountVerificationType = z.infer<
  typeof accountVerificationTypeSchema
>;

export const googleConfigSchema = z.discriminatedUnion('enabled', [
  z.object({
    enabled: z.literal(true),
    clientId: z.string({
      error: 'Google client ID is required when Google login is enabled.',
    }),
    clientSecret: z.string({
      error: 'Google client secret is required when Google login is enabled.',
    }),
  }),
  z.object({
    enabled: z.literal(false),
  }),
]);

export const accountConfigSchema = z.object({
  verificationType: accountVerificationTypeSchema.default('manual'),
  otpTimeout: z.coerce.number().default(600),
  google: googleConfigSchema.default({
    enabled: false,
  }),
});

export type AccountConfig = z.infer<typeof accountConfigSchema>;

export const readAccountConfigVariables = () => {
  return {
    verificationType: process.env.ACCOUNT_VERIFICATION_TYPE,
    otpTimeout: process.env.ACCOUNT_OTP_TIMEOUT,
    google: {
      enabled: process.env.ACCOUNT_GOOGLE_ENABLED === 'true',
      clientId: process.env.ACCOUNT_GOOGLE_CLIENT_ID,
      clientSecret: process.env.ACCOUNT_GOOGLE_CLIENT_SECRET,
    },
  };
};
