import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { MentionSearchQueryInput } from '@colanode/client/queries/mentions/mention-search';
import { Event } from '@colanode/client/types/events';
import { MentionSearchItem, MentionTargetType } from '@colanode/client/types/mentions';
import { MentionConstants } from '@colanode/core';

const DEFAULT_LIMIT = 20;

const RESOURCE_TYPES = [
    'channel',
    'page',
    'record',
    'database',
    'chat',
    'space',
    'folder',
    'file',
] as const;

const TYPE_LABELS: Record<MentionTargetType, string> = {
    user: 'User',
    group: 'Group',
    channel: 'Channel',
    page: 'Page',
    record: 'Record',
    database: 'Database',
    chat: 'Chat',
    space: 'Space',
    folder: 'Folder',
    file: 'File',
};

const GROUP_MENTIONS: MentionSearchItem[] = [
    {
        id: MentionConstants.Everyone,
        type: 'group',
        name: 'everyone',
        subtitle: 'Notify everyone in this conversation',
    },
];

const GROUP_ALIASES = ['everyone', 'here', 'channel'];

export class MentionSearchQueryHandler
    extends WorkspaceQueryHandlerBase
    implements QueryHandler<MentionSearchQueryInput> {
    public async handleQuery(
        input: MentionSearchQueryInput
    ): Promise<MentionSearchItem[]> {
        const workspace = this.getWorkspace(input.userId);
        const searchQuery = input.searchQuery.trim();
        const limit = input.limit ?? DEFAULT_LIMIT;
        const wildcard = `%${searchQuery}%`;
        const allowedTypes = input.allowedTypes;
        const allowedSet = allowedTypes ? new Set(allowedTypes) : null;
        const includeUsers = !allowedSet || allowedSet.has('user');
        const includeGroups = !allowedSet || allowedSet.has('group');
        const nodeTypes = (allowedSet
            ? RESOURCE_TYPES.filter((t) => allowedSet.has(t))
            : [...RESOURCE_TYPES]) as readonly (typeof RESOURCE_TYPES)[number][];

        const users = includeUsers
            ? await workspace.database
                .selectFrom('users')
                .select(['id', 'name', 'email', 'avatar'])
                .where('id', '!=', input.userId)
                .$if(searchQuery.length > 0, (qb) =>
                    qb.where('name', 'like', wildcard)
                )
                .orderBy('name', 'asc')
                .limit(limit)
                .execute()
            : [];

        const nodes = nodeTypes.length
            ? (
                await Promise.all(
                    nodeTypes.map((nodeType) =>
                        workspace.database
                            .selectFrom('nodes')
                            .leftJoin('node_texts', 'nodes.id', 'node_texts.id')
                            .select([
                                'nodes.id as id',
                                'nodes.type as type',
                                'node_texts.name as name',
                                'nodes.updated_at as updated_at',
                            ])
                            .where('nodes.type', '=', nodeType)
                            .$if(searchQuery.length > 0, (qb) =>
                                qb.where('node_texts.name', 'like', wildcard)
                            )
                            .orderBy('nodes.updated_at', 'desc')
                            .limit(limit)
                            .execute()
                    )
                )
            )
                .flat()
                .sort((a, b) =>
                    (b.updated_at ?? '').localeCompare(a.updated_at ?? '')
                )
            : [];

        const userItems: MentionSearchItem[] = users.map((user) => ({
            id: user.id,
            type: 'user',
            name: user.name,
            subtitle: user.email,
            avatar: user.avatar,
        }));

        const nodeItems: MentionSearchItem[] = nodes
            .filter((node) => !!node.name)
            .map((node) => {
                const type = node.type as MentionTargetType;
                return {
                    id: node.id,
                    type,
                    name: node.name ?? 'Unknown',
                    subtitle: TYPE_LABELS[type] ?? 'Resource',
                };
            });

        const lowerQuery = searchQuery.toLowerCase();
        const groupItems = includeGroups
            ? GROUP_MENTIONS.filter(() =>
                lowerQuery.length === 0
                    ? true
                    : GROUP_ALIASES.some((alias) =>
                        alias.startsWith(lowerQuery)
                    )
            )
            : [];

        return [...groupItems, ...userItems, ...nodeItems].slice(0, limit);
    }

    public async checkForChanges(
        event: Event,
        input: MentionSearchQueryInput,
        _: MentionSearchItem[]
    ): Promise<ChangeCheckResult<MentionSearchQueryInput>> {
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
            (event.type === 'user.created' ||
                event.type === 'user.updated' ||
                event.type === 'user.deleted' ||
                event.type === 'node.created' ||
                event.type === 'node.updated' ||
                event.type === 'node.deleted') &&
            event.workspace.userId === input.userId
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
