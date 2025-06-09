import { SelectNode } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { MessageListQueryInput } from '@colanode/client/queries/messages/message-list';
import { Event } from '@colanode/client/types/events';
import { LocalMessageNode } from '@colanode/client/types/nodes';
import { compareString } from '@colanode/core';

export class MessageListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<MessageListQueryInput>
{
  public async handleQuery(
    input: MessageListQueryInput
  ): Promise<LocalMessageNode[]> {
    const messages = await this.fetchMesssages(input);
    const messageNodes = messages.map(mapNode) as LocalMessageNode[];
    return messageNodes.sort((a, b) => compareString(a.id, b.id));
  }

  public async checkForChanges(
    event: Event,
    input: MessageListQueryInput,
    output: LocalMessageNode[]
  ): Promise<ChangeCheckResult<MessageListQueryInput>> {
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
      event.node.type === 'message' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.parentId === input.conversationId
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node.updated' &&
      event.node.type === 'message' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.parentId === input.conversationId
    ) {
      const message = output.find((message) => message.id === event.node.id);
      if (message) {
        const newResult = output.map((message) => {
          if (message.id === event.node.id) {
            return event.node as LocalMessageNode;
          }
          return message;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'node.deleted' &&
      event.node.type === 'message' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.parentId === input.conversationId
    ) {
      const message = output.find((message) => message.id === event.node.id);

      if (message) {
        const newOutput = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newOutput,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchMesssages(
    input: MessageListQueryInput
  ): Promise<SelectNode[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const messages = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('parent_id', '=', input.conversationId)
      .where('type', '=', 'message')
      .orderBy('id', 'desc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return messages;
  }
}
