import { z } from 'zod/v4';

import { resolveConfigReference } from './utils';

const smtpProviderConfigSchema = z.object({
  type: z.literal('smtp'),
  host: z
    .string({
      error: 'Email SMTP host is required when SMTP provider is used',
    })
    .transform(resolveConfigReference),
  port: z.coerce.number().default(587),
  secure: z.boolean().default(false),
  auth: z.object({
    user: z
      .string({
        error: 'Email SMTP user is required when SMTP provider is used',
      })
      .transform(resolveConfigReference),
    password: z
      .string({
        error: 'Email SMTP password is required when SMTP provider is used',
      })
      .transform(resolveConfigReference),
  }),
});

export const emailProviderConfigSchema = z.discriminatedUnion('type', [
  smtpProviderConfigSchema,
]);

export type EmailProviderConfig = z.infer<typeof emailProviderConfigSchema>;

export const emailConfigSchema = z
  .discriminatedUnion('enabled', [
    z.object({
      enabled: z.literal(true),
      from: z.object({
        email: z
          .string({
            error: 'Email from email is required when email is enabled',
          })
          .transform(resolveConfigReference),
        name: z
          .string({
            error: 'Email from name is required when email is enabled',
          })
          .default('Colanode')
          .transform(resolveConfigReference),
      }),
      provider: emailProviderConfigSchema,
    }),
    z.object({
      enabled: z.literal(false),
    }),
  ])
  .prefault({
    enabled: false,
  });

export type EmailConfig = z.infer<typeof emailConfigSchema>;
