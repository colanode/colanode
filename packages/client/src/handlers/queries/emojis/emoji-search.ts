import { mapEmoji } from '../../../lib/mappers';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { EmojiSearchQueryInput } from '../../../queries/emojis/emoji-search';
import { Emoji } from '../../../types/emojis';
import { Event } from '../../../types/events';
import { AssetService } from '../../../services/asset-service';

export class EmojiSearchQueryHandler
  implements QueryHandler<EmojiSearchQueryInput>
{
  private readonly asset: AssetService;

  constructor(asset: AssetService) {
    this.asset = asset;
  }

  public async handleQuery(input: EmojiSearchQueryInput): Promise<Emoji[]> {
    if (!this.asset.emojis) {
      return [];
    }

    const data = await this.asset.emojis
      .selectFrom('emojis')
      .innerJoin('emoji_search', 'emojis.id', 'emoji_search.id')
      .selectAll('emojis')
      .where('emoji_search.text', 'match', `${input.query}*`)
      .limit(input.count)
      .execute();

    const emojis: Emoji[] = data.map(mapEmoji);
    return emojis;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiSearchQueryInput,
    ___: Emoji[]
  ): Promise<ChangeCheckResult<EmojiSearchQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
