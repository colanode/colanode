import {
  EmailPasswordResetInitInput,
  EmailPasswordResetInitOutput,
} from '@colanode/core';
import axios from 'axios';

import { MutationHandler } from '@/main/lib/types';
import {
  EmailPasswordResetInitMutationInput,
  EmailPasswordResetInitMutationOutput,
} from '@/shared/mutations/accounts/email-password-reset-init';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { appService } from '@/main/services/app-service';
import { AccountMutationHandlerBase } from '@/main/mutations/accounts/base';

export class EmailPasswordResetInitMutationHandler
  extends AccountMutationHandlerBase
  implements MutationHandler<EmailPasswordResetInitMutationInput>
{
  async handleMutation(
    input: EmailPasswordResetInitMutationInput
  ): Promise<EmailPasswordResetInitMutationOutput> {
    const server = appService.getServer(input.server);

    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        `Server ${input.server} was not found! Try using a different server.`
      );
    }

    try {
      const emailPasswordResetInitInput: EmailPasswordResetInitInput = {
        email: input.email,
        platform: process.platform,
        version: appService.version,
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
