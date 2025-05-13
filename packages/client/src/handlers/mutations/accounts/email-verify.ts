import { EmailVerifyInput, LoginOutput } from '@colanode/core';
import axios from 'axios';

import { AccountMutationHandlerBase } from './base';

import { MutationHandler } from '../../../lib/types';
import { EmailVerifyMutationInput } from '../../../mutations/accounts/email-verify';
import { MutationError, MutationErrorCode } from '../../../mutations';
import { parseApiError } from '../../../lib/axios';
import { AppService } from '../../../services/app-service';

export class EmailVerifyMutationHandler
  extends AccountMutationHandlerBase
  implements MutationHandler<EmailVerifyMutationInput>
{
  constructor(appService: AppService) {
    super(appService);
  }

  async handleMutation(input: EmailVerifyMutationInput): Promise<LoginOutput> {
    const server = this.app.getServer(input.server);

    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        `Server ${input.server} was not found! Try using a different server.`
      );
    }

    try {
      const emailVerifyInput: EmailVerifyInput = {
        id: input.id,
        otp: input.otp,
        platform: this.app.build.platform,
        version: this.app.build.version,
      };

      const { data } = await axios.post<LoginOutput>(
        `${server.apiBaseUrl}/v1/accounts/emails/verify`,
        emailVerifyInput
      );

      if (data.type === 'verify') {
        throw new MutationError(
          MutationErrorCode.EmailVerificationFailed,
          'Email verification failed! Please try again.'
        );
      }

      await this.handleLoginSuccess(data, server);

      return data;
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
