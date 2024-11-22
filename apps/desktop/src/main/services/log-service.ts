import { app } from 'electron';
import pino, { Level } from 'pino';

const logConfig: Record<string, Level> = {
  main: 'info',
  'server-service': 'debug',
};

class LogService {
  public createLogger(name: string) {
    return pino({
      name,
      level: logConfig[name] || 'info',
      transport: !app.isPackaged
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
    });
  }
}

export const logService = new LogService();
