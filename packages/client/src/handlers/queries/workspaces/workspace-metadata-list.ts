import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { mapWorkspaceMetadata } from '../../../lib/mappers';
import { WorkspaceMetadataListQueryInput } from '../../../queries/workspaces/workspace-metadata-list';
import { Event } from '../../../types/events';
import { WorkspaceMetadata } from '../../../types/workspaces';
import { WorkspaceQueryHandlerBase } from '../workspace-query-handler-base';
import { SelectWorkspaceMetadata } from '../../../databases/workspace/schema';

export class WorkspaceMetadataListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<WorkspaceMetadataListQueryInput>
{
  public async handleQuery(
    input: WorkspaceMetadataListQueryInput
  ): Promise<WorkspaceMetadata[]> {
    const rows = await this.getWorkspaceMetadata(
      input.accountId,
      input.workspaceId
    );
    if (!rows) {
      return [];
    }

    return rows.map(mapWorkspaceMetadata);
  }

  public async checkForChanges(
    event: Event,
    input: WorkspaceMetadataListQueryInput,
    output: WorkspaceMetadata[]
  ): Promise<ChangeCheckResult<WorkspaceMetadataListQueryInput>> {
    if (
      event.type === 'workspace_created' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      const result = await this.handleQuery(input);
      return {
        hasChanges: true,
        result,
      };
    }

    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'workspace_metadata_saved' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const newOutput = [
        ...output.filter((metadata) => metadata.key !== event.metadata.key),
        event.metadata,
      ];

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'workspace_metadata_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
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

  private async getWorkspaceMetadata(
    accountId: string,
    workspaceId: string
  ): Promise<SelectWorkspaceMetadata[] | undefined> {
    const workspace = this.getWorkspace(accountId, workspaceId);
    const rows = await workspace.database
      .selectFrom('metadata')
      .selectAll()
      .execute();

    return rows;
  }
}
