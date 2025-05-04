import { z } from 'zod';

export const postgresConfigSchema = z.object({
  url: z.string({
    required_error:
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

export const readPostgresConfigVariables = () => {
  return {
    url: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED,
      ca: process.env.POSTGRES_SSL_CA,
      key: process.env.POSTGRES_SSL_KEY,
      cert: process.env.POSTGRES_SSL_CERT,
    },
  };
};
