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

    await server.sync();
    return {
      type: 'success',
    };
  }
}
