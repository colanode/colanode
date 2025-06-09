import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  AvatarUrlGetQueryInput,
  AvatarUrlGetQueryOutput,
} from '@colanode/client/queries/avatars/avatar-url-get';
import { AppService } from '@colanode/client/services/app-service';
import { Event } from '@colanode/client/types/events';

export class AvatarUrlGetQueryHandler
  implements QueryHandler<AvatarUrlGetQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    input: AvatarUrlGetQueryInput
  ): Promise<AvatarUrlGetQueryOutput> {
    const avatarPath = this.app.path.accountAvatar(
      input.accountId,
      input.avatarId
    );

    const avatarExists = await this.app.fs.exists(avatarPath);
    if (avatarExists) {
      const url = await this.app.fs.url(avatarPath);
      return {
        url,
      };
    }

    const account = this.app.getAccount(input.accountId);
    if (!account) {
      return {
        url: null,
      };
    }

    const downloaded = await account.downloadAvatar(input.avatarId);
    if (!downloaded) {
      return {
        url: null,
      };
    }

    const url = await this.app.fs.url(avatarPath);
    return {
      url,
    };
  }

  public async checkForChanges(
    event: Event,
    input: AvatarUrlGetQueryInput
  ): Promise<ChangeCheckResult<AvatarUrlGetQueryInput>> {
    if (
      event.type === 'avatar.downloaded' &&
      event.accountId === input.accountId &&
      event.avatarId === input.avatarId
    ) {
      const avatarPath = this.app.path.accountAvatar(
        input.accountId,
        input.avatarId
      );

      const avatarExists = await this.app.fs.exists(avatarPath);
      if (!avatarExists) {
        return {
          hasChanges: true,
          result: {
            url: null,
          },
        };
      }

      const url = await this.app.fs.url(avatarPath);
      return {
        hasChanges: true,
        result: {
          url,
        },
      };
    }

    return {
      hasChanges: false,
    };
  }
}
