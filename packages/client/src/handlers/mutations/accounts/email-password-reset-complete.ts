import {
  EmailPasswordResetCompleteInput,
  EmailPasswordResetCompleteOutput,
} from '@colanode/core';
import axios from 'axios';

import { AccountMutationHandlerBase } from './base';

import { MutationHandler } from '../../../lib/types';
import { MutationError, MutationErrorCode } from '../../../mutations';
import { parseApiError } from '../../../lib/axios';
import { AppService } from '../../../services/app-service';
import {
  EmailPasswordResetCompleteMutationInput,
  EmailPasswordResetCompleteMutationOutput,
} from '../../../mutations/accounts/email-password-reset-complete';

export class EmailPasswordResetCompleteMutationHandler
  extends AccountMutationHandlerBase
  implements MutationHandler<EmailPasswordResetCompleteMutationInput>
{
  constructor(appService: AppService) {
    super(appService);
  }

  async handleMutation(
    input: EmailPasswordResetCompleteMutationInput
  ): Promise<EmailPasswordResetCompleteMutationOutput> {
    const server = this.app.getServer(input.server);

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
        platform: this.app.build.platform,
        version: this.app.build.version,
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
