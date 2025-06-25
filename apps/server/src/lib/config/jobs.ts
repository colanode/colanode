import { z } from 'zod/v4';

const DEFAULT_BATCH_SIZE = 500;
const DEFAULT_MERGE_WINDOW_SECONDS = 60 * 60;
const DEFAULT_CUTOFF_WINDOW_HOURS = 2 * 60 * 60;
const DEFAULT_CRON_PATTERN = '0 5 */2 * * *'; // every 2 hours at the 5th minute

export const nodeUpdatesMergeJobConfigSchema = z.discriminatedUnion('enabled', [
  z.object({
    enabled: z.literal(true),
    cron: z.string().default(DEFAULT_CRON_PATTERN),
    batchSize: z.coerce.number().default(DEFAULT_BATCH_SIZE),
    mergeWindow: z.coerce.number().default(DEFAULT_MERGE_WINDOW_SECONDS),
    cutoffWindow: z.coerce.number().default(DEFAULT_CUTOFF_WINDOW_HOURS),
  }),
  z.object({
    enabled: z.literal(false),
  }),
]);

export const documentUpdatesMergeJobConfigSchema = z.discriminatedUnion(
  'enabled',
  [
    z.object({
      enabled: z.literal(true),
      cron: z.string().default(DEFAULT_CRON_PATTERN),
      batchSize: z.coerce.number().default(DEFAULT_BATCH_SIZE),
      mergeWindow: z.coerce.number().default(DEFAULT_MERGE_WINDOW_SECONDS),
      cutoffWindow: z.coerce.number().default(DEFAULT_CUTOFF_WINDOW_HOURS),
    }),
    z.object({
      enabled: z.literal(false),
    }),
  ]
);

export const jobsConfigSchema = z.object({
  nodeUpdatesMerge: nodeUpdatesMergeJobConfigSchema,
  documentUpdatesMerge: documentUpdatesMergeJobConfigSchema,
});

export type JobsConfig = z.infer<typeof jobsConfigSchema>;

export const readJobsConfigVariables = () => {
  return {
    nodeUpdatesMerge: {
      enabled: process.env.JOBS_NODE_UPDATES_MERGE_ENABLED === 'true',
      cron: process.env.JOBS_NODE_UPDATES_MERGE_CRON,
      batchSize: process.env.JOBS_NODE_UPDATES_MERGE_BATCH_SIZE,
      timeWindowMinutes:
        process.env.JOBS_NODE_UPDATES_MERGE_TIME_WINDOW_MINUTES,
      excludeRecentHours:
        process.env.JOBS_NODE_UPDATES_MERGE_EXCLUDE_RECENT_HOURS,
    },
    documentUpdatesMerge: {
      enabled: process.env.JOBS_DOCUMENT_UPDATES_MERGE_ENABLED === 'true',
      cron: process.env.JOBS_DOCUMENT_UPDATES_MERGE_CRON,
      batchSize: process.env.JOBS_DOCUMENT_UPDATES_MERGE_BATCH_SIZE,
      timeWindowMinutes:
        process.env.JOBS_DOCUMENT_UPDATES_MERGE_TIME_WINDOW_MINUTES,
      excludeRecentHours:
        process.env.JOBS_DOCUMENT_UPDATES_MERGE_EXCLUDE_RECENT_HOURS,
    },
  };
};
