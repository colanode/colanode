import ms from 'ms';
import { z } from 'zod/v4';

import { resolveConfigReference } from './utils';

const DEFAULT_BATCH_SIZE = 500;
const DEFAULT_MERGE_WINDOW = ms('1 hour') / 1000; // in seconds
const DEFAULT_CUTOFF_WINDOW = ms('2 hours') / 1000; // in seconds
const DEFAULT_CRON_PATTERN = '0 5 */2 * * *'; // every 2 hours at the 5th minute

export const nodeUpdatesMergeJobConfigSchema = z
  .discriminatedUnion('enabled', [
    z.object({
      enabled: z.literal(true),
      cron: z
        .string()
        .default(DEFAULT_CRON_PATTERN)
        .transform(resolveConfigReference),
      batchSize: z.coerce.number().default(DEFAULT_BATCH_SIZE),
      mergeWindow: z.coerce.number().default(DEFAULT_MERGE_WINDOW),
      cutoffWindow: z.coerce.number().default(DEFAULT_CUTOFF_WINDOW),
    }),
    z.object({
      enabled: z.literal(false),
    }),
  ])
  .prefault({
    enabled: false,
  });

export const documentUpdatesMergeJobConfigSchema = z
  .discriminatedUnion('enabled', [
    z.object({
      enabled: z.literal(true),
      cron: z
        .string()
        .default(DEFAULT_CRON_PATTERN)
        .transform(resolveConfigReference),
      batchSize: z.coerce.number().default(DEFAULT_BATCH_SIZE),
      mergeWindow: z.coerce.number().default(DEFAULT_MERGE_WINDOW),
      cutoffWindow: z.coerce.number().default(DEFAULT_CUTOFF_WINDOW),
    }),
    z.object({
      enabled: z.literal(false),
    }),
  ])
  .prefault({
    enabled: false,
  });

export const cleanupJobConfigSchema = z
  .discriminatedUnion('enabled', [
    z.object({
      enabled: z.literal(true),
      cron: z
        .string()
        .default(DEFAULT_CRON_PATTERN)
        .transform(resolveConfigReference),
    }),
    z.object({
      enabled: z.literal(false),
    }),
  ])
  .prefault({
    enabled: false,
  });

export const jobsQueueSchema = z
  .object({
    name: z.string().default('jobs').transform(resolveConfigReference),
    prefix: z.string().default('colanode').transform(resolveConfigReference),
  })
  .prefault({});

export const jobsConfigSchema = z
  .object({
    queue: jobsQueueSchema,
    nodeUpdatesMerge: nodeUpdatesMergeJobConfigSchema,
    documentUpdatesMerge: documentUpdatesMergeJobConfigSchema,
    cleanup: cleanupJobConfigSchema,
  })
  .prefault({});

export type JobsConfig = z.infer<typeof jobsConfigSchema>;
