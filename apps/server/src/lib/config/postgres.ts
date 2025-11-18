import { z } from 'zod/v4';

export const postgresConfigSchema = z.object({
  url: z.string({
    error:
      'POSTGRES_URL is required (e.g. postgres://postgres:postgres@localhost:5432/postgres)',
  }),
  ssl: z.object({
    rejectUnauthorized: z.preprocess(
      (val) => (val === undefined ? undefined : val === 'true'),
      z.boolean().optional()
    ),
    ca: z.string().optional(),
    key: z.string().optional(),
    cert: z.string().optional(),
  }),
});

export type PostgresConfig = z.infer<typeof postgresConfigSchema>;
