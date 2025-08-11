import { sha256 } from 'js-sha256';
import ms from 'ms';

import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { parseApiError } from '@colanode/client/lib/ky';
import { AppService } from '@colanode/client/services/app-service';
import { ApiErrorCode } from '@colanode/core';

export type TokenDeleteInput = {
  type: 'token.delete';
  token: string;
  server: string;
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'token.delete': {
      input: TokenDeleteInput;
    };
  }
}

export class TokenDeleteJobHandler implements JobHandler<TokenDeleteInput> {
  private readonly app: AppService;

  public readonly concurrency: JobConcurrencyConfig<TokenDeleteInput> = {
    limit: 1,
    key: (input: TokenDeleteInput) => `token.delete.${sha256(input.token)}`,
  };

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleJob(input: TokenDeleteInput): Promise<JobOutput> {
    const server = this.app.getServer(input.server);
    if (!server) {
      return {
        type: 'cancel',
      };
    }

    if (!server.isAvailable) {
      return {
        type: 'retry',
        delay: ms('1 minute'),
      };
    }

    try {
      await this.app.client.delete(`${server.httpBaseUrl}/v1/accounts/logout`, {
        headers: {
          Authorization: `Bearer ${input.token}`,
        },
      });

      return {
        type: 'success',
      };
    } catch (error) {
      const parsedError = await parseApiError(error);
      if (
        parsedError.code === ApiErrorCode.TokenInvalid ||
        parsedError.code === ApiErrorCode.AccountNotFound ||
        parsedError.code === ApiErrorCode.DeviceNotFound
      ) {
        return {
          type: 'cancel',
        };
      }

      return {
        type: 'retry',
        delay: ms('1 minute'),
      };
    }
  }
}
