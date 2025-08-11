import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { AppService } from '@colanode/client/services/app-service';

export type AvatarsCleanInput = {
  type: 'avatars.clean';
  accountId: string;
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
    key: (input: AvatarsCleanInput) => `avatars.clean.${input.accountId}`,
  };

  public async handleJob(input: AvatarsCleanInput): Promise<JobOutput> {
    const account = this.app.getAccount(input.accountId);
    if (!account) {
      return {
        type: 'cancel',
      };
    }

    await account.avatars.cleanupAvatars();
    return {
      type: 'success',
    };
  }
}
