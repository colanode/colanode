import { radarService } from '@/main/services/radar-service';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { RadarDataGetQueryInput } from '@/shared/queries/interactions/radar-data-get';
import { Event } from '@/shared/types/events';
import { WorkspaceRadarData } from '@/shared/types/radars';

export class RadarDataGetQueryHandler
  implements QueryHandler<RadarDataGetQueryInput>
{
  public async handleQuery(
    _: RadarDataGetQueryInput
  ): Promise<Record<string, WorkspaceRadarData>> {
    const data = radarService.getData();
    return data;
  }

  public async checkForChanges(
    event: Event,
    _: RadarDataGetQueryInput,
    ___: Record<string, WorkspaceRadarData>
  ): Promise<ChangeCheckResult<RadarDataGetQueryInput>> {
    if (event.type === 'radar_data_updated') {
      const data = radarService.getData();
      return {
        hasChanges: true,
        result: data,
      };
    }

    return {
      hasChanges: false,
    };
  }
}
