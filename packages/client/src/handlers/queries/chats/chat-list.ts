import { SelectNode } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { ChatListQueryInput } from '@colanode/client/queries/chats/chat-list';
import { Event } from '@colanode/client/types/events';
import { LocalChatNode } from '@colanode/client/types/nodes';

export class ChatListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<ChatListQueryInput>
{
  public async handleQuery(
    input: ChatListQueryInput
  ): Promise<LocalChatNode[]> {
    const rows = await this.fetchChildren(input);
    return rows.map(mapNode) as LocalChatNode[];
  }

  public async checkForChanges(
    event: Event,
    input: ChatListQueryInput,
    output: LocalChatNode[]
  ): Promise<ChangeCheckResult<ChatListQueryInput>> {
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
      event.type === 'node.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.type === 'chat'
    ) {
      const newChildren = [...output, event.node];
      return {
        hasChanges: true,
        result: newChildren,
      };
    }

    if (
      event.type === 'node.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.type === 'chat'
    ) {
      const node = output.find((node) => node.id === event.node.id);
      if (node) {
        const newChildren = output.map((node) =>
          node.id === event.node.id ? (event.node as LocalChatNode) : node
        );

        return {
          hasChanges: true,
          result: newChildren,
        };
      }
    }

    if (
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.type === 'chat'
    ) {
      const node = output.find((node) => node.id === event.node.id);
      if (node) {
        const newChildren = output.filter((node) => node.id !== event.node.id);
        return {
          hasChanges: true,
          result: newChildren,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchChildren(
    input: ChatListQueryInput
  ): Promise<SelectNode[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const rows = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('parent_id', 'is', null)
      .where('type', '=', 'chat')
      .execute();

    return rows;
  }
}
