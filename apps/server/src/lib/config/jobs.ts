import ms from 'ms';
import { z } from 'zod/v4';

const DEFAULT_BATCH_SIZE = 500;
const DEFAULT_MERGE_WINDOW = ms('1 hour') / 1000; // in seconds
const DEFAULT_CUTOFF_WINDOW = ms('2 hours') / 1000; // in seconds
const DEFAULT_CRON_PATTERN = '0 5 */2 * * *'; // every 2 hours at the 5th minute

export const nodeUpdatesMergeJobConfigSchema = z.discriminatedUnion('enabled', [
  z.object({
    enabled: z.literal(true),
    cron: z.string().default(DEFAULT_CRON_PATTERN),
    batchSize: z.coerce.number().default(DEFAULT_BATCH_SIZE),
    mergeWindow: z.coerce.number().default(DEFAULT_MERGE_WINDOW),
    cutoffWindow: z.coerce.number().default(DEFAULT_CUTOFF_WINDOW),
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
      mergeWindow: z.coerce.number().default(DEFAULT_MERGE_WINDOW),
      cutoffWindow: z.coerce.number().default(DEFAULT_CUTOFF_WINDOW),
    }),
    z.object({
      enabled: z.literal(false),
    }),
  ]
);

export const uploadsCleanJobConfigSchema = z.discriminatedUnion('enabled', [
  z.object({
    enabled: z.literal(true),
    cron: z.string().default(DEFAULT_CRON_PATTERN),
  }),
  z.object({
    enabled: z.literal(false),
  }),
]);

export const jobsConfigSchema = z.object({
  nodeUpdatesMerge: nodeUpdatesMergeJobConfigSchema,
  documentUpdatesMerge: documentUpdatesMergeJobConfigSchema,
  uploadsClean: uploadsCleanJobConfigSchema,
});

export type JobsConfig = z.infer<typeof jobsConfigSchema>;

export const readJobsConfigVariables = () => {
  return {
    nodeUpdatesMerge: {
      enabled: process.env.JOBS_NODE_UPDATES_MERGE_ENABLED === 'true',
      cron: process.env.JOBS_NODE_UPDATES_MERGE_CRON,
      batchSize: process.env.JOBS_NODE_UPDATES_MERGE_BATCH_SIZE,
      mergeWindow: process.env.JOBS_NODE_UPDATES_MERGE_MERGE_WINDOW,
      cutoffWindow: process.env.JOBS_NODE_UPDATES_MERGE_CUTOFF_WINDOW,
    },
    documentUpdatesMerge: {
      enabled: process.env.JOBS_DOCUMENT_UPDATES_MERGE_ENABLED === 'true',
      cron: process.env.JOBS_DOCUMENT_UPDATES_MERGE_CRON,
      batchSize: process.env.JOBS_DOCUMENT_UPDATES_MERGE_BATCH_SIZE,
      mergeWindow: process.env.JOBS_DOCUMENT_UPDATES_MERGE_MERGE_WINDOW,
      cutoffWindow: process.env.JOBS_DOCUMENT_UPDATES_MERGE_CUTOFF_WINDOW,
    },
    uploadsClean: {
      enabled: process.env.JOBS_UPLOADS_CLEAN_ENABLED === 'true',
      cron: process.env.JOBS_UPLOADS_CLEAN_CRON,
    },
  };
};
