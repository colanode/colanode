import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  RadarDataGetQueryInput,
  RadarDataGetQueryOutput,
} from '@colanode/client/queries/interactions/radar-data-get';
import { AppService } from '@colanode/client/services/app-service';
import { Event } from '@colanode/client/types/events';
import { WorkspaceRadarData } from '@colanode/client/types/radars';

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
