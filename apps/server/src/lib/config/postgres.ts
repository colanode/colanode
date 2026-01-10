import { z } from 'zod/v4';

import {
  resolveConfigReference,
  resolveOptionalConfigReference,
} from './utils';

export const postgresConfigSchema = z
  .object({
    url: z
      .string({
        error:
          'Postgres URL is required (e.g. postgres://postgres:postgres@localhost:5432/postgres)',
      })
      .default('env://POSTGRES_URL')
      .transform(resolveConfigReference),
    ssl: z
      .object({
        rejectUnauthorized: z.boolean().optional(),
        ca: z.string().optional().transform(resolveOptionalConfigReference),
        key: z.string().optional().transform(resolveOptionalConfigReference),
        cert: z.string().optional().transform(resolveOptionalConfigReference),
      })
      .optional(),
  })
  .prefault({});

export type PostgresConfig = z.infer<typeof postgresConfigSchema>;
