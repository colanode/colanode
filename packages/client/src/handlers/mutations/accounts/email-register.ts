import { EmailRegisterInput, LoginOutput } from '@colanode/core';
import axios from 'axios';

import { AccountMutationHandlerBase } from './base';

import { MutationHandler } from '../../../lib/types';
import { EmailRegisterMutationInput } from '../../../mutations/accounts/email-register';
import { MutationError, MutationErrorCode } from '../../../mutations';
import { parseApiError } from '../../../lib/axios';
import { AppService } from '../../../services/app-service';

export class EmailRegisterMutationHandler
  extends AccountMutationHandlerBase
  implements MutationHandler<EmailRegisterMutationInput>
{
  constructor(appService: AppService) {
    super(appService);
  }

  async handleMutation(
    input: EmailRegisterMutationInput
  ): Promise<LoginOutput> {
    const server = this.app.getServer(input.server);

    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        `Server ${input.server} was not found! Try using a different server.`
      );
    }

    try {
      const emailRegisterInput: EmailRegisterInput = {
        name: input.name,
        email: input.email,
        password: input.password,
        platform: this.app.build.platform,
        version: this.app.build.version,
      };

      const { data } = await axios.post<LoginOutput>(
        `${server.apiBaseUrl}/v1/accounts/emails/register`,
        emailRegisterInput
      );

      if (data.type === 'verify') {
        return data;
      }

      await this.handleLoginSuccess(data, server);

      return data;
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
