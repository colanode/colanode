// import FormData from 'form-data';

// import fs from 'fs';

import { MutationHandler } from '../../../lib/types';
import {
  AvatarUploadMutationInput,
  AvatarUploadMutationOutput,
} from '../../../mutations/avatars/avatar-upload';
import { MutationError, MutationErrorCode } from '../../../mutations';
// import { parseApiError } from '../../../lib/axios';
import { AppService } from '../../../services/app-service';

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
