import { compareString,MessageNode } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectNode } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import { MessageListQueryInput } from '@/shared/queries/message-list';
import { Event } from '@/shared/types/events';

export class MessageListQueryHandler
  implements QueryHandler<MessageListQueryInput>
{
  public async handleQuery(
    input: MessageListQueryInput
  ): Promise<MessageNode[]> {
    const messages = await this.fetchMesssages(input);
    return this.buildMessages(messages);
  }

  public async checkForChanges(
    event: Event,
    input: MessageListQueryInput,
    output: MessageNode[]
  ): Promise<ChangeCheckResult<MessageListQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'node_created' &&
      event.userId === input.userId &&
      event.node.type === 'message' &&
      event.node.parentId === input.conversationId
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node_updated' &&
      event.userId === input.userId &&
      event.node.type === 'message' &&
      event.node.parentId === input.conversationId
    ) {
      const message = output.find((message) => message.id === event.node.id);
      if (message) {
        const newResult = output.map((message) => {
          if (message.id === event.node.id) {
            return event.node as MessageNode;
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
      event.type === 'node_deleted' &&
      event.userId === input.userId &&
      event.node.type === 'message' &&
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
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const offset = (input.page - 1) * input.count;
    const messages = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('parent_id', '=', input.conversationId),
          eb('type', '=', 'message'),
        ])
      )
      .orderBy('id', 'desc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return messages;
  }

  private buildMessages = (rows: SelectNode[]): MessageNode[] => {
    const nodes = rows.map(mapNode);
    const messageNodes: MessageNode[] = [];

    for (const node of nodes) {
      if (node.type !== 'message') {
        continue;
      }

      messageNodes.push(node);
    }

    return messageNodes.sort((a, b) => compareString(a.id, b.id));
  };
}
