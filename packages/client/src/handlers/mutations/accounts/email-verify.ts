import { AccountMutationHandlerBase } from '@colanode/client/handlers/mutations/accounts/base';
import { parseApiError } from '@colanode/client/lib/ky';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import { EmailVerifyMutationInput } from '@colanode/client/mutations/accounts/email-verify';
import { AppService } from '@colanode/client/services/app-service';
import { EmailVerifyInput, LoginOutput } from '@colanode/core';

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
      const body: EmailVerifyInput = {
        id: input.id,
        otp: input.otp,
      };

      const response = await this.app.client
        .post(`${server.httpBaseUrl}/v1/accounts/emails/verify`, {
          json: body,
        })
        .json<LoginOutput>();

      if (response.type === 'verify') {
        throw new MutationError(
          MutationErrorCode.EmailVerificationFailed,
          'Email verification failed! Please try again.'
        );
      }

      await this.handleLoginSuccess(response, server);

      return response;
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
