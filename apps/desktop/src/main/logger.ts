import { app } from 'electron';
import pino, { Level, Logger } from 'pino';
import path from 'path';

const logConfig: Record<string, Level> = {
  main: 'trace',
  'server-service': 'trace',
  'file-service': 'trace',
};

const loggers: Record<string, Logger> = {};
const logPath = path.join(app.getPath('userData'), 'logs.log');

export const createLogger = (name: string) => {
  if (!loggers[name]) {
    loggers[name] = pino({
      name,
      level: logConfig[name] || 'trace',
      transport: app.isPackaged
        ? {
            target: 'pino/file',
            options: {
              destination: logPath,
              mkdir: true,
              autoEnd: false,
            },
          }
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              autoEnd: false,
            },
          },
    });
  }

  return loggers[name];
};

export const closeLoggers = () => {
  Object.values(loggers).forEach((logger) => {
    logger.flush();
  });
};
