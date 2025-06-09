import { SelectWorkspaceMetadata } from '@colanode/client/databases/workspace/schema';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { mapWorkspaceMetadata } from '@colanode/client/lib/mappers';
import { WorkspaceMetadataListQueryInput } from '@colanode/client/queries/workspaces/workspace-metadata-list';
import { Event } from '@colanode/client/types/events';
import { WorkspaceMetadata } from '@colanode/client/types/workspaces';

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
      event.type === 'workspace.created' &&
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
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'workspace.metadata.updated' &&
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
      event.type === 'workspace.metadata.deleted' &&
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
