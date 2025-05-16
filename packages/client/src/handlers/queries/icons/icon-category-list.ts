import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { IconCategoryListQueryInput } from '../../../queries/icons/icon-category-list';
import { IconCategory } from '../../../types/icons';
import { Event } from '../../../types/events';
import { AssetService } from '../../../services/asset-service';

export class IconCategoryListQueryHandler
  implements QueryHandler<IconCategoryListQueryInput>
{
  private readonly asset: AssetService;

  constructor(asset: AssetService) {
    this.asset = asset;
  }

  public async handleQuery(
    _: IconCategoryListQueryInput
  ): Promise<IconCategory[]> {
    if (!this.asset.icons) {
      return [];
    }

    const data = this.asset.icons
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
