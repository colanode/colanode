import { mapEmoji } from '../../../lib/mappers';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { EmojiListQueryInput } from '../../../queries/emojis/emoji-list';
import { Emoji } from '../../../types/emojis';
import { Event } from '../../../types/events';
import { AssetService } from '../../../services/asset-service';

export class EmojiListQueryHandler
  implements QueryHandler<EmojiListQueryInput>
{
  private readonly asset: AssetService;

  constructor(asset: AssetService) {
    this.asset = asset;
  }

  public async handleQuery(input: EmojiListQueryInput): Promise<Emoji[]> {
    if (!this.asset.emojis) {
      return [];
    }

    const offset = input.page * input.count;
    const data = await this.asset.emojis
      .selectFrom('emojis')
      .selectAll()
      .where('category_id', '=', input.category)
      .limit(input.count)
      .offset(offset)
      .execute();

    const emojis: Emoji[] = data.map(mapEmoji);
    return emojis;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiListQueryInput,
    ___: Emoji[]
  ): Promise<ChangeCheckResult<EmojiListQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
