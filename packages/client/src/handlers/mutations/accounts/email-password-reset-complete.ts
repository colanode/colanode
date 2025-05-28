import { AccountMutationHandlerBase } from '@colanode/client/handlers/mutations/accounts/base';
import { MutationHandler } from '@colanode/client/lib';
import { parseApiError } from '@colanode/client/lib/ky';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  EmailPasswordResetCompleteMutationInput,
  EmailPasswordResetCompleteMutationOutput,
} from '@colanode/client/mutations/accounts/email-password-reset-complete';
import { AppService } from '@colanode/client/services/app-service';
import {
  EmailPasswordResetCompleteInput,
  EmailPasswordResetCompleteOutput,
} from '@colanode/core';

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
      const body: EmailPasswordResetCompleteInput = {
        id: input.id,
        otp: input.otp,
        password: input.password,
      };

      const response = await this.app.client
        .post(
          `${server.httpBaseUrl}/v1/accounts/emails/passwords/reset/complete`,
          {
            json: body,
          }
        )
        .json<EmailPasswordResetCompleteOutput>();

      return response;
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
