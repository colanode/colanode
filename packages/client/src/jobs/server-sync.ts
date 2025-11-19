import ms from 'ms';

import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { AppService } from '@colanode/client/services/app-service';

export type ServerSyncInput = {
  type: 'server.sync';
  server: string;
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'server.sync': {
      input: ServerSyncInput;
    };
  }
}

export class ServerSyncJobHandler implements JobHandler<ServerSyncInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public readonly concurrency: JobConcurrencyConfig<ServerSyncInput> = {
    limit: 1,
    key: (input: ServerSyncInput) => `server.sync.${input.server}`,
  };

  public async handleJob(input: ServerSyncInput): Promise<JobOutput> {
    const server = this.app.getServer(input.server);
    if (!server) {
      return {
        type: 'cancel',
      };
    }

    const accounts = this.app
      .getAccounts()
      .filter((account) => account.server.domain === server.domain);

    if (accounts.length === 0) {
      // don't sync if the server has no active accounts and has been synced in the last day
      const lastSyncedAt = server.server.syncedAt;
      if (lastSyncedAt && lastSyncedAt.getTime() > Date.now() - ms('1 day')) {
        return {
          type: 'success',
        };
      }
    }

    await server.sync();
    return {
      type: 'success',
    };
  }
}
