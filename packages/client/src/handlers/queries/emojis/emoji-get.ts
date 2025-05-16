import { mapEmoji } from '../../../lib/mappers';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { EmojiGetQueryInput } from '../../../queries/emojis/emoji-get';
import { Emoji } from '../../../types/emojis';
import { Event } from '../../../types/events';
import { AssetService } from '../../../services/asset-service';

export class EmojiGetQueryHandler implements QueryHandler<EmojiGetQueryInput> {
  private readonly asset: AssetService;

  constructor(asset: AssetService) {
    this.asset = asset;
  }

  public async handleQuery(input: EmojiGetQueryInput): Promise<Emoji | null> {
    if (!this.asset.emojis) {
      return null;
    }

    const data = await this.asset.emojis
      .selectFrom('emojis')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!data) {
      return null;
    }

    const emoji = mapEmoji(data);
    return emoji;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiGetQueryInput,
    ___: Emoji | null
  ): Promise<ChangeCheckResult<EmojiGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
