import ms from 'ms';

import { mapAvatar } from '@colanode/client/lib';
import { eventBus } from '@colanode/client/lib/event-bus';
import { AccountService } from '@colanode/client/services/accounts/account-service';
import { Avatar } from '@colanode/client/types/avatars';

export class AvatarService {
  private readonly account: AccountService;

  constructor(account: AccountService) {
    this.account = account;
  }

  public async getAvatar(
    avatar: string,
    autoDownload?: boolean
  ): Promise<Avatar | null> {
    const updatedAvatar = await this.account.database
      .updateTable('avatars')
      .returningAll()
      .set({
        opened_at: new Date().toISOString(),
      })
      .where('id', '=', avatar)
      .executeTakeFirst();

    if (updatedAvatar) {
      const url = await this.account.app.fs.url(updatedAvatar.path);
      return mapAvatar(updatedAvatar, url);
    }

    if (autoDownload) {
      await this.account.app.jobs.addJob(
        {
          type: 'avatar.download',
          accountId: this.account.id,
          avatar,
        },
        {
          deduplication: {
            key: `avatar.download.${avatar}`,
          },
          retries: 5,
        }
      );
    }

    return null;
  }

  public async downloadAvatar(avatar: string): Promise<boolean | null> {
    if (!this.account.server.isAvailable) {
      return null;
    }

    const response = await this.account.client.get<ArrayBuffer>(
      `v1/avatars/${avatar}`
    );

    if (response.status !== 200) {
      return false;
    }

    const avatarPath = this.account.app.path.accountAvatar(
      this.account.id,
      avatar
    );

    const avatarBytes = new Uint8Array(await response.arrayBuffer());
    await this.account.app.fs.writeFile(avatarPath, avatarBytes);

    const createdAvatar = await this.account.database
      .insertInto('avatars')
      .returningAll()
      .values({
        id: avatar,
        path: avatarPath,
        size: avatarBytes.length,
        created_at: new Date().toISOString(),
        opened_at: new Date().toISOString(),
      })
      .onConflict((oc) =>
        oc.columns(['id']).doUpdateSet({
          opened_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!createdAvatar) {
      return false;
    }

    const url = await this.account.app.fs.url(avatarPath);
    eventBus.publish({
      type: 'avatar.created',
      accountId: this.account.id,
      avatar: mapAvatar(createdAvatar, url),
    });

    return true;
  }

  public async cleanupAvatars(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - ms('7 days')).toISOString();
    const unopenedAvatars = await this.account.database
      .deleteFrom('avatars')
      .where('opened_at', '<', sevenDaysAgo)
      .returningAll()
      .execute();

    for (const avatar of unopenedAvatars) {
      await this.account.app.fs.delete(avatar.path);

      eventBus.publish({
        type: 'avatar.deleted',
        accountId: this.account.id,
        avatar: mapAvatar(avatar, ''),
      });
    }
  }
}
