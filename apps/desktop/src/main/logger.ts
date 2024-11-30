import { app } from 'electron';
import pino, { Level } from 'pino';

const logConfig: Record<string, Level> = {
  main: 'trace',
  'server-service': 'trace',
  'file-service': 'trace',
};

export const createLogger = (name: string) => {
  return pino({
    name,
    level: logConfig[name] || 'trace',
    transport: !app.isPackaged
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
  });
};
