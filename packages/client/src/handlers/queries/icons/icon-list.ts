import { mapIcon } from '../../../lib/mappers';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { IconListQueryInput } from '../../../queries/icons/icon-list';
import { Icon } from '../../../types/icons';
import { Event } from '../../../types/events';
import { AssetService } from '../../../services/asset-service';

export class IconListQueryHandler implements QueryHandler<IconListQueryInput> {
  private readonly asset: AssetService;

  constructor(asset: AssetService) {
    this.asset = asset;
  }

  public async handleQuery(input: IconListQueryInput): Promise<Icon[]> {
    if (!this.asset.icons) {
      return [];
    }

    const offset = input.page * input.count;
    const data = await this.asset.icons
      .selectFrom('icons')
      .selectAll()
      .where('category_id', '=', input.category)
      .limit(input.count)
      .offset(offset)
      .execute();

    const icons: Icon[] = data.map(mapIcon);
    return icons;
  }

  public async checkForChanges(
    _: Event,
    __: IconListQueryInput,
    ___: Icon[]
  ): Promise<ChangeCheckResult<IconListQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
