import { appService } from '@/main/services/app-service';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import {
  RadarDataGetQueryInput,
  RadarDataGetQueryOutput,
} from '@/shared/queries/interactions/radar-data-get';
import { Event } from '@/shared/types/events';
import { WorkspaceRadarData } from '@/shared/types/radars';

export class RadarDataGetQueryHandler
  implements QueryHandler<RadarDataGetQueryInput>
{
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
    const accounts = appService.getAccounts();
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
