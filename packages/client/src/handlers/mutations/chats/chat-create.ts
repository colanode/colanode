import { sql } from 'kysely';

import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  ChatCreateMutationInput,
  ChatCreateMutationOutput,
} from '@colanode/client/mutations/chats/chat-create';
import { ChatAttributes, generateId, IdType } from '@colanode/core';

interface ChatRow {
  id: string;
}

export class ChatCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<ChatCreateMutationInput>
{
  public async handleMutation(
    input: ChatCreateMutationInput
  ): Promise<ChatCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const query = sql<ChatRow>`
      SELECT id
      FROM nodes
      WHERE type = 'chat'
      AND json_extract(attributes, '$.collaborators.${sql.raw(input.userId)}') is not null
      AND json_extract(attributes, '$.collaborators.${sql.raw(workspace.userId)}') is not null
    `.compile(workspace.database);

    const existingChats = await workspace.database.executeQuery(query);
    const chat = existingChats.rows?.[0];
    if (chat) {
      return {
        id: chat.id,
      };
    }

    const id = generateId(IdType.Chat);
    const attributes: ChatAttributes = {
      type: 'chat',
      collaborators: {
        [input.userId]: 'admin',
        [workspace.userId]: 'admin',
      },
    };

    await workspace.nodes.createNode({
      id,
      attributes,
      parentId: null,
    });

    return {
      id,
    };
  }
}
