import {
  EmailPasswordResetCompleteInput,
  EmailPasswordResetCompleteOutput,
} from '@colanode/core';
import axios from 'axios';

import { MutationHandler } from '@/main/lib/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { appService } from '@/main/services/app-service';
import { AccountMutationHandlerBase } from '@/main/mutations/accounts/base';
import {
  EmailPasswordResetCompleteMutationInput,
  EmailPasswordResetCompleteMutationOutput,
} from '@/shared/mutations/accounts/email-password-reset-complete';

export class EmailPasswordResetCompleteMutationHandler
  extends AccountMutationHandlerBase
  implements MutationHandler<EmailPasswordResetCompleteMutationInput>
{
  async handleMutation(
    input: EmailPasswordResetCompleteMutationInput
  ): Promise<EmailPasswordResetCompleteMutationOutput> {
    const server = appService.getServer(input.server);

    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        `Server ${input.server} was not found! Try using a different server.`
      );
    }

    try {
      const emailPasswordResetCompleteInput: EmailPasswordResetCompleteInput = {
        id: input.id,
        otp: input.otp,
        password: input.password,
        platform: process.platform,
        version: appService.version,
      };

      const { data } = await axios.post<EmailPasswordResetCompleteOutput>(
        `${server.apiBaseUrl}/v1/accounts/emails/passwords/reset/complete`,
        emailPasswordResetCompleteInput
      );

      return data;
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
