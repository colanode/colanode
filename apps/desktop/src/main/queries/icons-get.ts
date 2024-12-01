import { assetService } from '@/main/services/asset-service';
import { ChangeCheckResult,QueryHandler } from '@/main/types';
import { IconsGetQueryInput } from '@/shared/queries/icons-get';
import { Event } from '@/shared/types/events';
import { IconData } from '@/shared/types/icons';

export class IconsGetQueryHandler implements QueryHandler<IconsGetQueryInput> {
  public async handleQuery(_: IconsGetQueryInput): Promise<IconData> {
    const data = assetService.getIconData();

    return data;
  }

  public async checkForChanges(
    _: Event,
    __: IconsGetQueryInput,
    ___: IconData
  ): Promise<ChangeCheckResult<IconsGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
