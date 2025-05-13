import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { IconCategoryListQueryInput } from '../../../queries/icons/icon-category-list';
import { IconCategory } from '../../../types/icons';
import { Event } from '../../../types/events';
import { AppService } from '../../../services/app-service';

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
