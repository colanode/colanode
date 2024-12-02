import FormData from 'form-data';

import fs from 'fs';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { httpClient } from '@/shared/lib/http-client';
import {
  AvatarUploadMutationInput,
  AvatarUploadMutationOutput,
} from '@/shared/mutations/avatars/avatar-upload';
import { MutationError } from '@/shared/mutations';

interface AvatarUploadResponse {
  id: string;
}

export class AvatarUploadMutationHandler
  implements MutationHandler<AvatarUploadMutationInput>
{
  async handleMutation(
    input: AvatarUploadMutationInput
  ): Promise<AvatarUploadMutationOutput> {
    const credentials = await databaseService.appDatabase
      .selectFrom('accounts')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select(['domain', 'attributes', 'token'])
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!credentials) {
      throw new MutationError(
        'account_not_found',
        'Account not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    const filePath = input.filePath;
    const fileStream = fs.createReadStream(filePath);

    const formData = new FormData();
    formData.append('avatar', fileStream);

    const { data } = await httpClient.post<AvatarUploadResponse>(
      '/v1/avatars',
      formData,
      {
        domain: credentials.domain,
        token: credentials.token,
        headers: formData.getHeaders(),
      }
    );

    return {
      id: data.id,
    };
  }
}
