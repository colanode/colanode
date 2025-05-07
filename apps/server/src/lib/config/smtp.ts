import { z } from 'zod';

export const smtpConfigSchema = z.discriminatedUnion('enabled', [
  z.object({
    enabled: z.literal(true),
    host: z.string({
      required_error: 'SMTP_HOST is required when SMTP is enabled',
    }),
    port: z.coerce.number().default(587),
    secure: z.boolean().default(false),
    user: z.string({
      required_error: 'SMTP_USER is required when SMTP is enabled',
    }),
    password: z.string({
      required_error: 'SMTP_PASSWORD is required when SMTP is enabled',
    }),
    from: z.object({
      email: z.string({
        required_error: 'SMTP_EMAIL_FROM is required when SMTP is enabled',
      }),
      name: z.string().default('Colanode'),
    }),
  }),
  z.object({
    enabled: z.literal(false),
  }),
]);

export type SmtpConfig = z.infer<typeof smtpConfigSchema>;

export const readSmtpConfigVariables = () => {
  return {
    enabled: process.env.SMTP_ENABLED === 'true',
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: {
      email: process.env.SMTP_EMAIL_FROM,
      name: process.env.SMTP_NAME,
    },
  };
};
