import axios from 'axios';

import { AccountMutationHandlerBase } from '@colanode/client/handlers/mutations/accounts/base';
import { parseApiError } from '@colanode/client/lib/axios';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import { EmailLoginMutationInput } from '@colanode/client/mutations/accounts/email-login';
import { AppService } from '@colanode/client/services/app-service';
import { EmailLoginInput, LoginOutput } from '@colanode/core';

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
