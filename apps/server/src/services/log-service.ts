import pino, { Level } from 'pino';

import { host } from '@/host';

const logConfig: Record<string, Level> = {
  api: 'trace',
  'synapse-service': 'trace',
};

class LogService {
  public createLogger(name: string) {
    return pino({
      name,
      level: logConfig[name] || 'trace',
      transport:
        host.environment === 'development'
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
