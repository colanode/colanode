import { mapEmoji } from '../../../lib/mappers';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { EmojiGetBySkinIdQueryInput } from '../../../queries/emojis/emoji-get-by-skin-id';
import { Emoji } from '../../../types/emojis';
import { Event } from '../../../types/events';
import { AppService } from '../../../services/app-service';

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
    if (!this.app.asset.emojis) {
      return null;
    }

    const data = await this.app.asset.emojis
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
