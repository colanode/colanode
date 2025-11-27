import { z } from 'zod/v4';

const smtpProviderConfigSchema = z.object({
  type: z.literal('smtp'),
  host: z
    .string({
      error: 'EMAIL_SMTP_HOST is required when SMTP provider is used',
    })
    .default('smtp'),
  port: z.coerce.number().default(587),
  secure: z.boolean().default(false),
  auth: z.object({
    user: z.string({
      error: 'EMAIL_SMTP_USER is required when SMTP provider is used',
    }),
    password: z.string({
      error: 'EMAIL_SMTP_PASSWORD is required when SMTP provider is used',
    }),
  }),
});

export const emailProviderConfigSchema = z.discriminatedUnion('type', [
  smtpProviderConfigSchema,
]);

export type EmailProviderConfig = z.infer<typeof emailProviderConfigSchema>;

export const emailConfigSchema = z.discriminatedUnion('enabled', [
  z.object({
    enabled: z.literal(true),
    from: z.object({
      email: z.string({
        error: 'EMAIL_FROM is required when email is enabled',
      }),
      name: z.string().default('Colanode'),
    }),
    provider: emailProviderConfigSchema,
  }),
  z.object({
    enabled: z.literal(false),
  }),
]);

export type EmailConfig = z.infer<typeof emailConfigSchema>;
