import { SelectAppMetadata } from '@colanode/client/databases/app/schema';
import { mapAppMetadata } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { AppMetadataListQueryInput } from '@colanode/client/queries/apps/app-metadata-list';
import { AppService } from '@colanode/client/services/app-service';
import { AppMetadata } from '@colanode/client/types/apps';
import { Event } from '@colanode/client/types/events';

export class AppMetadataListQueryHandler
  implements QueryHandler<AppMetadataListQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    _: AppMetadataListQueryInput
  ): Promise<AppMetadata[]> {
    const rows = await this.getAppMetadata();
    if (!rows) {
      return [];
    }

    return rows.map(mapAppMetadata);
  }

  public async checkForChanges(
    event: Event,
    _: AppMetadataListQueryInput,
    output: AppMetadata[]
  ): Promise<ChangeCheckResult<AppMetadataListQueryInput>> {
    if (event.type === 'app.metadata.updated') {
      const newOutput = [
        ...output.filter((metadata) => metadata.key !== event.metadata.key),
        event.metadata,
      ];

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'app.metadata.deleted') {
      const newOutput = output.filter(
        (metadata) => metadata.key !== event.metadata.key
      );

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async getAppMetadata(): Promise<SelectAppMetadata[] | undefined> {
    const rows = await this.app.database
      .selectFrom('metadata')
      .selectAll()
      .execute();

    return rows;
  }
}
