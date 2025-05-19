import axios from 'axios';

import { AccountMutationHandlerBase } from '@colanode/client/handlers/mutations/accounts/base';
import { parseApiError } from '@colanode/client/lib/axios';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  EmailPasswordResetInitMutationInput,
  EmailPasswordResetInitMutationOutput,
} from '@colanode/client/mutations/accounts/email-password-reset-init';
import { AppService } from '@colanode/client/services/app-service';
import {
  EmailPasswordResetInitInput,
  EmailPasswordResetInitOutput,
} from '@colanode/core';

export class EmailPasswordResetInitMutationHandler
  extends AccountMutationHandlerBase
  implements MutationHandler<EmailPasswordResetInitMutationInput>
{
  constructor(appService: AppService) {
    super(appService);
  }

  async handleMutation(
    input: EmailPasswordResetInitMutationInput
  ): Promise<EmailPasswordResetInitMutationOutput> {
    const server = this.app.getServer(input.server);

    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        `Server ${input.server} was not found! Try using a different server.`
      );
    }

    try {
      const emailPasswordResetInitInput: EmailPasswordResetInitInput = {
        email: input.email,
        platform: this.app.build.platform,
        version: this.app.build.version,
      };

      const { data } = await axios.post<EmailPasswordResetInitOutput>(
        `${server.apiBaseUrl}/v1/accounts/emails/passwords/reset/init`,
        emailPasswordResetInitInput
      );

      return data;
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
