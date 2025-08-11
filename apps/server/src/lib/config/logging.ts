import { z } from 'zod/v4';

export const loggingConfigSchema = z.object({
  level: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .default('info'),
});

export type LoggingConfig = z.infer<typeof loggingConfigSchema>;

export const readLoggingConfigVariables = () => {
  return {
    level: process.env.LOGGING_LEVEL,
  };
};
