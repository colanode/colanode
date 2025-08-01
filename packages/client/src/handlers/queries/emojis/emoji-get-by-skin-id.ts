import { mapEmoji } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { EmojiGetBySkinIdQueryInput } from '@colanode/client/queries/emojis/emoji-get-by-skin-id';
import { AppService } from '@colanode/client/services/app-service';
import { Emoji } from '@colanode/client/types/emojis';
import { Event } from '@colanode/client/types/events';

export class EmojiGetBySkinIdQueryHandler
  implements QueryHandler<EmojiGetBySkinIdQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    input: EmojiGetBySkinIdQueryInput
  ): Promise<Emoji | null> {
    if (!this.app.assets.emojis) {
      return null;
    }

    const data = await this.app.assets.emojis
      .selectFrom('emojis')
      .innerJoin('emoji_skins', 'emojis.id', 'emoji_skins.emoji_id')
      .selectAll('emojis')
      .where('emoji_skins.skin_id', '=', input.id)
      .executeTakeFirst();

    if (!data) {
      return null;
    }

    const emoji = mapEmoji(data);
    return emoji;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiGetBySkinIdQueryInput,
    ___: Emoji | null
  ): Promise<ChangeCheckResult<EmojiGetBySkinIdQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
