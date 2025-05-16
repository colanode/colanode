import { mapIcon } from '../../../lib/mappers';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { IconSearchQueryInput } from '../../../queries/icons/icon-search';
import { Icon } from '../../../types/icons';
import { Event } from '../../../types/events';
import { AssetService } from '../../../services/asset-service';

export class IconSearchQueryHandler
  implements QueryHandler<IconSearchQueryInput>
{
  private readonly asset: AssetService;

  constructor(asset: AssetService) {
    this.asset = asset;
  }

  public async handleQuery(input: IconSearchQueryInput): Promise<Icon[]> {
    if (!this.asset.icons) {
      return [];
    }

    const data = await this.asset.icons
      .selectFrom('icons')
      .innerJoin('icon_search', 'icons.id', 'icon_search.id')
      .selectAll('icons')
      .where('icon_search.text', 'match', `${input.query}*`)
      .limit(input.count)
      .execute();

    const icons: Icon[] = data.map(mapIcon);
    return icons;
  }

  public async checkForChanges(
    _: Event,
    __: IconSearchQueryInput,
    ___: Icon[]
  ): Promise<ChangeCheckResult<IconSearchQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
