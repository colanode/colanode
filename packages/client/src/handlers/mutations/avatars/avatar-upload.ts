// import FormData from 'form-data';

// import fs from 'fs';

import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AvatarUploadMutationInput,
  AvatarUploadMutationOutput,
} from '@colanode/client/mutations/avatars/avatar-upload';
import { AppService } from '@colanode/client/services/app-service';

// interface AvatarUploadResponse {
//   id: string;
// }

export class AvatarUploadMutationHandler
  implements MutationHandler<AvatarUploadMutationInput>
{
  private readonly app: AppService;

  constructor(appService: AppService) {
    this.app = appService;
  }

  async handleMutation(
    input: AvatarUploadMutationInput
  ): Promise<AvatarUploadMutationOutput> {
    const account = this.app.getAccount(input.accountId);

    if (!account) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    throw new Error('Not implemented');

    // try {
    //   const filePath = input.filePath;
    //   const fileStream = fs.createReadStream(filePath);

    //   const formData = new FormData();
    //   formData.append('avatar', fileStream);

    //   const { data } = await account.client.post<AvatarUploadResponse>(
    //     '/v1/avatars',
    //     formData,
    //     {
    //       headers: formData.getHeaders(),
    //     }
    //   );

    //   return {
    //     id: data.id,
    //   };
    // } catch (error) {
    //   const apiError = parseApiError(error);
    //   throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    // }
  }
}
