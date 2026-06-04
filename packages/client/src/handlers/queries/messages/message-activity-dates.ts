import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { MessageActivityDatesQueryInput } from '@colanode/client/queries/messages/message-activity-dates';
import { Event } from '@colanode/client/types/events';
import { sql } from 'kysely';

export class MessageActivityDatesQueryHandler
    extends WorkspaceQueryHandlerBase
    implements QueryHandler<MessageActivityDatesQueryInput> {
    public async handleQuery(
        input: MessageActivityDatesQueryInput
    ): Promise<string[]> {
        const workspace = this.getWorkspace(input.userId);

        const rows = await workspace.database
            .selectFrom('nodes')
            .where('nodes.type', '=', 'message')
            .where('nodes.parent_id', '=', input.conversationId)
            .select(
                sql<string>`strftime('%Y-%m-%d', datetime(nodes.created_at, 'localtime'))`.as(
                    'day'
                )
            )
            .distinct()
            .execute();

        return rows
            .map((row) => row.day)
            .filter((day): day is string => !!day);
    }

    public async checkForChanges(
        event: Event,
        input: MessageActivityDatesQueryInput,
        _: string[]
    ): Promise<ChangeCheckResult<MessageActivityDatesQueryInput>> {
        if (
            event.type === 'workspace.deleted' &&
            event.workspace.userId === input.userId
        ) {
            return {
                hasChanges: true,
                result: [],
            };
        }

        if (
            (event.type === 'node.created' ||
                event.type === 'node.updated' ||
                event.type === 'node.deleted') &&
            event.workspace.userId === input.userId &&
            event.node.type === 'message' &&
            event.node.parentId === input.conversationId
        ) {
            return {
                hasChanges: true,
                result: await this.handleQuery(input),
            };
        }

        return {
            hasChanges: false,
        };
    }
}
