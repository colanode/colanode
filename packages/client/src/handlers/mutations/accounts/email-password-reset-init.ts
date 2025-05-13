import {
  EmailPasswordResetInitInput,
  EmailPasswordResetInitOutput,
} from '@colanode/core';
import axios from 'axios';

import { AccountMutationHandlerBase } from './base';

import { MutationHandler } from '../../../lib/types';
import {
  EmailPasswordResetInitMutationInput,
  EmailPasswordResetInitMutationOutput,
} from '../../../mutations/accounts/email-password-reset-init';
import { MutationError, MutationErrorCode } from '../../../mutations';
import { parseApiError } from '../../../lib/axios';
import { AppService } from '../../../services/app-service';

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
