import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { AppService } from '@colanode/client/services/app-service';

export type AccountSyncInput = {
  type: 'account.sync';
  accountId: string;
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'account.sync': {
      input: AccountSyncInput;
    };
  }
}

export class AccountSyncJobHandler implements JobHandler<AccountSyncInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public readonly concurrency: JobConcurrencyConfig<AccountSyncInput> = {
    limit: 1,
    key: (input: AccountSyncInput) => `account.sync.${input.accountId}`,
  };

  public async handleJob(input: AccountSyncInput): Promise<JobOutput> {
    const account = this.app.getAccount(input.accountId);
    if (!account) {
      return {
        type: 'cancel',
      };
    }

    await account.sync();
    return {
      type: 'success',
    };
  }
}
