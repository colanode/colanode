import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { IconCategoryListQueryInput } from '@colanode/client/queries/icons/icon-category-list';
import { AppService } from '@colanode/client/services/app-service';
import { Event } from '@colanode/client/types/events';
import { IconCategory } from '@colanode/client/types/icons';

export class IconCategoryListQueryHandler
  implements QueryHandler<IconCategoryListQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    _: IconCategoryListQueryInput
  ): Promise<IconCategory[]> {
    if (!this.app.asset.icons) {
      return [];
    }

    const data = this.app.asset.icons
      .selectFrom('categories')
      .selectAll()
      .execute();
    return data;
  }

  public async checkForChanges(
    _: Event,
    __: IconCategoryListQueryInput,
    ___: IconCategory[]
  ): Promise<ChangeCheckResult<IconCategoryListQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
