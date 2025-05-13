import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { EmojiCategoryListQueryInput } from '../../../queries/emojis/emoji-category-list';
import { EmojiCategory } from '../../../types/emojis';
import { Event } from '../../../types/events';
import { AppService } from '../../../services/app-service';

export class EmojiCategoryListQueryHandler
  implements QueryHandler<EmojiCategoryListQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    _: EmojiCategoryListQueryInput
  ): Promise<EmojiCategory[]> {
    const data = this.app.asset.emojis
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
