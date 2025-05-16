import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { EmojiCategoryListQueryInput } from '../../../queries/emojis/emoji-category-list';
import { EmojiCategory } from '../../../types/emojis';
import { Event } from '../../../types/events';
import { AssetService } from '../../../services/asset-service';

export class EmojiCategoryListQueryHandler
  implements QueryHandler<EmojiCategoryListQueryInput>
{
  private readonly asset: AssetService;

  constructor(asset: AssetService) {
    this.asset = asset;
  }

  public async handleQuery(
    _: EmojiCategoryListQueryInput
  ): Promise<EmojiCategory[]> {
    if (!this.asset.emojis) {
      return [];
    }

    const data = this.asset.emojis
      .selectFrom('categories')
      .selectAll()
      .execute();

    return data;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiCategoryListQueryInput,
    ___: EmojiCategory[]
  ): Promise<ChangeCheckResult<EmojiCategoryListQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
