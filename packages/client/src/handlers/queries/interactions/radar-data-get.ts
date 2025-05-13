import { AppService } from '../../../services/app-service';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import {
  RadarDataGetQueryInput,
  RadarDataGetQueryOutput,
} from '../../../queries/interactions/radar-data-get';
import { Event } from '../../../types/events';
import { WorkspaceRadarData } from '../../../types/radars';

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
      event.type === 'radar_data_updated' ||
      event.type === 'workspace_created' ||
      event.type === 'workspace_deleted' ||
      event.type === 'account_created' ||
      event.type === 'account_deleted';

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
    const accounts = this.app.getAccounts();
    if (accounts.length === 0) {
      return result;
    }

    for (const account of accounts) {
      const accountResult: Record<string, WorkspaceRadarData> = {};
      const workspaces = account.getWorkspaces();

      for (const workspace of workspaces) {
        const radarData = workspace.radar.getData();
        accountResult[workspace.id] = radarData;
      }

      result[account.id] = accountResult;
    }

    return result;
  }
}
