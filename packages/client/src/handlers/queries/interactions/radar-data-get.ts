import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  RadarDataGetQueryInput,
  RadarDataGetQueryOutput,
} from '@colanode/client/queries/interactions/radar-data-get';
import { AppService } from '@colanode/client/services/app-service';
import { Event } from '@colanode/client/types/events';

export class RadarDataGetQueryHandler
  implements QueryHandler<RadarDataGetQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    _: RadarDataGetQueryInput
  ): Promise<RadarDataGetQueryOutput> {
    const data = this.getRadarData();
    return data;
  }

  public async checkForChanges(
    event: Event,
    _: RadarDataGetQueryInput,
    ___: RadarDataGetQueryOutput
  ): Promise<ChangeCheckResult<RadarDataGetQueryInput>> {
    const shouldUpdate =
      event.type === 'radar.data.updated' ||
      event.type === 'workspace.created' ||
      event.type === 'workspace.deleted' ||
      event.type === 'account.created' ||
      event.type === 'account.deleted';

    if (shouldUpdate) {
      const data = this.getRadarData();
      return {
        hasChanges: true,
        result: data,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private getRadarData(): RadarDataGetQueryOutput {
    const result: RadarDataGetQueryOutput = {};

    const workspaces = this.app.getWorkspaces();

    for (const workspace of workspaces) {
      const radarData = workspace.radar.getData();
      result[workspace.userId] = radarData;
    }

    return result;
  }
}
