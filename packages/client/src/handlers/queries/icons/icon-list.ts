import { mapIcon } from '../../../lib/mappers';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { IconListQueryInput } from '../../../queries/icons/icon-list';
import { Icon } from '../../../types/icons';
import { Event } from '../../../types/events';
import { AppService } from '../../../services/app-service';

export class IconListQueryHandler implements QueryHandler<IconListQueryInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(input: IconListQueryInput): Promise<Icon[]> {
    if (!this.app.asset.icons) {
      return [];
    }

    const offset = input.page * input.count;
    const data = await this.app.asset.icons
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
