import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { mapNode } from '@colanode/client/lib/mappers';
import { MessageSearchQueryInput } from '@colanode/client/queries/messages/message-search';
import { Event } from '@colanode/client/types/events';
import { LocalMessageNode } from '@colanode/client/types/nodes';
import { sql } from 'kysely';

const DEFAULT_LIMIT = 300;

const buildFtsQuery = (query: string): string => {
    return query
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 0)
        .map((term) => `${term.replace(/"/g, '')}*`)
        .join(' ');
};

export class MessageSearchQueryHandler
    extends WorkspaceQueryHandlerBase
    implements QueryHandler<MessageSearchQueryInput> {
    public async handleQuery(
        input: MessageSearchQueryInput
    ): Promise<LocalMessageNode[]> {
        const workspace = this.getWorkspace(input.userId);
        const searchQuery = input.searchQuery?.trim() ?? '';
        const limit = input.limit ?? DEFAULT_LIMIT;

        if (input.threadRootMessageId) {
            const threadRoot = await workspace.database
                .selectFrom('nodes')
                .where('nodes.id', '=', input.threadRootMessageId)
                .where('nodes.type', '=', 'message')
                .where('nodes.parent_id', '=', input.conversationId)
                .selectAll('nodes')
                .executeTakeFirst();

            const threadReplies = await workspace.database
                .selectFrom('nodes')
                .where('nodes.type', '=', 'message')
                .where('nodes.parent_id', '=', input.conversationId)
                .where(
                    sql<boolean>`json_extract(nodes.attributes, '$.referenceId') = ${input.threadRootMessageId}`
                )
                .orderBy('nodes.created_at', 'asc')
                .limit(limit)
                .selectAll('nodes')
                .execute();

            const rows = [
                ...(threadRoot ? [threadRoot] : []),
                ...threadReplies.filter((row) => row.id !== input.threadRootMessageId),
            ];

            return rows.map((row) => mapNode(row) as LocalMessageNode);
        }

        const fromCreatedAt = input.fromCreatedAt;
        const toCreatedAt = input.toCreatedAt;

        const rows = await workspace.database
            .selectFrom('nodes')
            .where('nodes.type', '=', 'message')
            .where('nodes.parent_id', '=', input.conversationId)
            .$if(searchQuery.length > 0, (qb) =>
                qb
                    .innerJoin('node_texts', 'nodes.id', 'node_texts.id')
                    .where(
                        'node_texts.attributes',
                        'match',
                        buildFtsQuery(searchQuery)
                    )
            )
            .$if(fromCreatedAt != null, (qb) =>
                qb.where('nodes.created_at', '>=', fromCreatedAt!)
            )
            .$if(toCreatedAt != null, (qb) =>
                qb.where('nodes.created_at', '<=', toCreatedAt!)
            )
            .$if(input.pinnedOnly === true, (qb) =>
                qb.where(
                    sql<boolean>`json_extract(nodes.attributes, '$.pinnedAt') IS NOT NULL`
                )
            )
            .selectAll('nodes')
            .orderBy('nodes.created_at', 'asc')
            .limit(limit)
            .execute();

        return rows.map((row) => mapNode(row) as LocalMessageNode);
    }

    public async checkForChanges(
        event: Event,
        input: MessageSearchQueryInput,
        _: LocalMessageNode[]
    ): Promise<ChangeCheckResult<MessageSearchQueryInput>> {
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