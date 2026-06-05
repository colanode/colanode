import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { LocalSyncStatusGetQueryInput } from '@colanode/client/queries/workspaces/local-sync-status-get';
import { Event } from '@colanode/client/types/events';
import { LocalSyncStatus } from '@colanode/client/types/workspaces';

export class LocalSyncStatusGetQueryHandler
    extends WorkspaceQueryHandlerBase
    implements QueryHandler<LocalSyncStatusGetQueryInput> {
    public async handleQuery(
        input: LocalSyncStatusGetQueryInput
    ): Promise<LocalSyncStatus | null> {
        const workspace = this.getWorkspace(input.userId);
        return workspace.cloudSync?.getStatus() ?? null;
    }

    public async checkForChanges(
        event: Event,
        input: LocalSyncStatusGetQueryInput
    ): Promise<ChangeCheckResult<LocalSyncStatusGetQueryInput>> {
        if (
            event.type === 'local.sync.status.updated' &&
            event.workspace.userId === input.userId
        ) {
            return {
                hasChanges: true,
                result: event.status,
            };
        }

        if (
            event.type === 'workspace.deleted' &&
            event.workspace.userId === input.userId
        ) {
            return {
                hasChanges: true,
                result: null,
            };
        }

        return {
            hasChanges: false,
        };
    }
}
