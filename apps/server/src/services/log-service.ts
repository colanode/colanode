import pino, { Level } from 'pino';
const isDev = true; //process.env.NODE_ENV === 'development';

const logConfig: Record<string, Level> = {
  api: 'trace',
  'synapse-service': 'trace',
};

class LogService {
  public createLogger(name: string) {
    return pino({
      name,
      level: logConfig[name] || 'trace',
      transport: isDev
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
