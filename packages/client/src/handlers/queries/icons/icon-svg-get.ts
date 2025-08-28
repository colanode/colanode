import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { IconSvgGetQueryInput } from '@colanode/client/queries/icons/icon-svg-get';
import { AppService } from '@colanode/client/services/app-service';

export class IconSvgGetQueryHandler
  implements QueryHandler<IconSvgGetQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    input: IconSvgGetQueryInput
  ): Promise<string | null> {
    if (!this.app.assets.icons) {
      return null;
    }

    const row = await this.app.assets.icons
      .selectFrom('icon_svgs')
      .select('svg')
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    const svg = row.svg.toString('utf-8');
    return svg;
  }

  public async checkForChanges(): Promise<
    ChangeCheckResult<IconSvgGetQueryInput>
  > {
    return {
      hasChanges: false,
    };
  }
}
