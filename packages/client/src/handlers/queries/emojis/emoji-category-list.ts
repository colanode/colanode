import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { EmojiCategoryListQueryInput } from '@colanode/client/queries/emojis/emoji-category-list';
import { AppService } from '@colanode/client/services/app-service';
import { EmojiCategory } from '@colanode/client/types/emojis';
import { Event } from '@colanode/client/types/events';

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
    if (!this.app.asset.emojis) {
      return [];
    }

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
