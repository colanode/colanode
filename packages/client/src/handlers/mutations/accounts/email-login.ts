import { EmailLoginInput, LoginOutput } from '@colanode/core';
import axios from 'axios';

import { AccountMutationHandlerBase } from './base';

import { MutationHandler } from '../../../lib/types';
import { EmailLoginMutationInput } from '../../../mutations/accounts/email-login';
import { MutationError, MutationErrorCode } from '../../../mutations';
import { parseApiError } from '../../../lib/axios';
import { AppService } from '../../../services/app-service';

export class EmailLoginMutationHandler
  extends AccountMutationHandlerBase
  implements MutationHandler<EmailLoginMutationInput>
{
  constructor(appService: AppService) {
    super(appService);
  }

  async handleMutation(input: EmailLoginMutationInput): Promise<LoginOutput> {
    const server = this.app.getServer(input.server);

    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        `Server ${input.server} was not found! Try using a different server.`
      );
    }

    try {
      const emailLoginInput: EmailLoginInput = {
        email: input.email,
        password: input.password,
        platform: this.app.build.platform,
        version: this.app.build.version,
      };

      const { data } = await axios.post<LoginOutput>(
        `${server.apiBaseUrl}/v1/accounts/emails/login`,
        emailLoginInput
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
