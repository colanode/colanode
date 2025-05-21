import { fileTypeFromBuffer } from 'file-type';

import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AvatarUploadMutationInput,
  AvatarUploadMutationOutput,
} from '@colanode/client/mutations/avatars/avatar-upload';
import { AppService } from '@colanode/client/services/app-service';

interface AvatarUploadResponse {
  id: string;
}

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

    try {
      const filePath = `${this.app.paths.temp}/${input.fileName}`;
      const fileExists = await this.app.fs.exists(filePath);

      if (!fileExists) {
        throw new Error(`File ${filePath} does not exist`);
      }

      const fileBuffer = await this.app.fs.readFile(filePath);
      const fileType = await fileTypeFromBuffer(fileBuffer);

      if (!fileType) {
        throw new Error('Could not determine file type');
      }

      const { data } = await account.client.post<AvatarUploadResponse>(
        '/v1/avatars',
        fileBuffer,
        {
          headers: {
            'Content-Type': fileType.mime,
          },
        }
      );

      await account.downloadAvatar(data.id);

      return {
        id: data.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new MutationError(MutationErrorCode.ApiError, error.message);
      }
      throw new MutationError(
        MutationErrorCode.ApiError,
        'Unknown error occurred'
      );
    } finally {
      try {
        const filePath = `${this.app.paths.temp}/${input.fileName}`;
        await this.app.fs.delete(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
