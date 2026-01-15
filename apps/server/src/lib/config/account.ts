import { z } from 'zod/v4';

import { resolveConfigReference } from './utils';

export const accountVerificationTypeSchema = z.enum([
  'automatic',
  'manual',
  'email',
]);

export type AccountVerificationType = z.infer<
  typeof accountVerificationTypeSchema
>;

export const googleConfigSchema = z
  .discriminatedUnion('enabled', [
    z.object({
      enabled: z.literal(true),
      clientId: z
        .string({
          error: 'Google client ID is required when Google login is enabled.',
        })
        .transform(resolveConfigReference),
      clientSecret: z
        .string({
          error:
            'Google client secret is required when Google login is enabled.',
        })
        .transform(resolveConfigReference),
    }),
    z.object({
      enabled: z.literal(false),
    }),
  ])
  .prefault({
    enabled: false,
  });

export const accountConfigSchema = z
  .object({
    verificationType: accountVerificationTypeSchema
      .transform(resolveConfigReference)
      .default('automatic'),
    otpTimeout: z.coerce.number().default(600),
    google: googleConfigSchema,
  })
  .prefault({});

export type AccountConfig = z.infer<typeof accountConfigSchema>;
