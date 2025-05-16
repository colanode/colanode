import { mapEmoji } from '../../../lib/mappers';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { EmojiGetBySkinIdQueryInput } from '../../../queries/emojis/emoji-get-by-skin-id';
import { Emoji } from '../../../types/emojis';
import { Event } from '../../../types/events';
import { AssetService } from '../../../services/asset-service';

export class EmojiGetBySkinIdQueryHandler
  implements QueryHandler<EmojiGetBySkinIdQueryInput>
{
  private readonly asset: AssetService;

  constructor(asset: AssetService) {
    this.asset = asset;
  }

  public async handleQuery(
    input: EmojiGetBySkinIdQueryInput
  ): Promise<Emoji | null> {
    if (!this.asset.emojis) {
      return null;
    }

    const data = await this.asset.emojis
      .selectFrom('emojis')
      .innerJoin('emoji_svgs', 'emojis.id', 'emoji_svgs.emoji_id')
      .selectAll('emojis')
      .where('emoji_svgs.skin_id', '=', input.id)
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
