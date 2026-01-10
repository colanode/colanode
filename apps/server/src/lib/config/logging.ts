import { z } from 'zod/v4';

import { resolveConfigReference } from './utils';

export const loggingConfigSchema = z
  .object({
    level: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
      .default('info')
      .transform(resolveConfigReference),
  })
  .prefault({});

export type LoggingConfig = z.infer<typeof loggingConfigSchema>;
