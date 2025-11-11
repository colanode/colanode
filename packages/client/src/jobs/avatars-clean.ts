import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { AppService } from '@colanode/client/services/app-service';

export type AvatarsCleanInput = {
  type: 'avatars.clean';
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'avatars.clean': {
      input: AvatarsCleanInput;
    };
  }
}

export class AvatarsCleanJobHandler implements JobHandler<AvatarsCleanInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public readonly concurrency: JobConcurrencyConfig<AvatarsCleanInput> = {
    limit: 1,
    key: () => `avatars.clean`,
  };

  public async handleJob(): Promise<JobOutput> {
    await this.app.assets.cleanupAvatars();
    return {
      type: 'success',
    };
  }
}
