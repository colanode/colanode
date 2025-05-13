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

  public async handleQuery(input: EmojiGetBySkinIdQueryInput): Promise<Emoji> {
    const data = await this.app.asset.emojis
      .selectFrom('emojis')
      .innerJoin('emoji_svgs', 'emojis.id', 'emoji_svgs.emoji_id')
      .selectAll('emojis')
      .where('emoji_svgs.skin_id', '=', input.id)
      .executeTakeFirst();

    if (!data) {
      throw new Error('Emoji not found');
    }

    const emoji = mapEmoji(data);
    return emoji;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiGetBySkinIdQueryInput,
    ___: Emoji
  ): Promise<ChangeCheckResult<EmojiGetBySkinIdQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
