import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { IconSvgGetQueryInput } from '@colanode/client/queries/icons/icon-svg-get';
import { AppService } from '@colanode/client/services/app-service';
import { bytesToString } from '@colanode/core';

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
    const row = await this.app.assets.icons
      .selectFrom('icon_svgs')
      .select('svg')
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    const svg = bytesToString(row.svg);
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
