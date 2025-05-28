import { AccountMutationHandlerBase } from '@colanode/client/handlers/mutations/accounts/base';
import { parseApiError } from '@colanode/client/lib/ky';
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
      const body: EmailLoginInput = {
        email: input.email,
        password: input.password,
      };

      const response = await this.app.client
        .post(`${server.httpBaseUrl}/v1/accounts/emails/login`, {
          json: body,
        })
        .json<LoginOutput>();

      if (response.type === 'verify') {
        return response;
      }

      await this.handleLoginSuccess(response, server);

      return response;
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
