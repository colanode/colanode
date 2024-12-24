import { SyncMessageData, SyncMessageReactionData } from '@colanode/core';

import { mapMessage, mapMessageReaction } from '@/main/utils';
import { databaseService } from '@/main/data/database-service';
import { createDebugger } from '@/main/debugger';
import { eventBus } from '@/shared/lib/event-bus';

class MessageService {
  private readonly debug = createDebugger('service:message');

  public async syncServerMessage(userId: string, message: SyncMessageData) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingMessage = await workspaceDatabase
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', message.id)
      .executeTakeFirst();

    const version = BigInt(message.version);
    if (existingMessage) {
      if (existingMessage.version === version) {
        this.debug(`Server message ${message.id} is already synced`);
        return;
      }

      const updatedMessage = await workspaceDatabase
        .updateTable('messages')
        .returningAll()
        .set({
          content: JSON.stringify(message.content),
          type: message.type,
          updated_at: message.updatedAt,
          updated_by: message.updatedBy,
          root_id: message.rootId,
          version,
        })
        .where('id', '=', message.id)
        .executeTakeFirst();

      if (!updatedMessage) {
        return;
      }

      eventBus.publish({
        type: 'message_updated',
        userId,
        message: mapMessage(updatedMessage),
      });

      this.debug(`Server message ${message.id} has been synced`);
      return;
    }

    const createdMessage = await workspaceDatabase
      .insertInto('messages')
      .returningAll()
      .values({
        id: message.id,
        version,
        type: message.type,
        parent_id: message.entryId,
        entry_id: message.entryId,
        root_id: message.rootId,
        content: JSON.stringify(message.content),
        created_at: message.createdAt,
        created_by: message.createdBy,
        updated_at: message.updatedAt,
        updated_by: message.updatedBy,
      })
      .executeTakeFirst();

    if (!createdMessage) {
      return;
    }

    eventBus.publish({
      type: 'message_created',
      userId,
      message: mapMessage(createdMessage),
    });

    this.debug(`Server message ${message.id} has been synced`);
  }

  public async syncServerMessageReaction(
    userId: string,
    messageReaction: SyncMessageReactionData
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingMessageReaction = await workspaceDatabase
      .selectFrom('message_reactions')
      .selectAll()
      .where('message_id', '=', messageReaction.messageId)
      .where('collaborator_id', '=', messageReaction.collaboratorId)
      .where('reaction', '=', messageReaction.reaction)
      .executeTakeFirst();

    const version = BigInt(messageReaction.version);
    if (existingMessageReaction) {
      if (existingMessageReaction.version === version) {
        this.debug(
          `Server message reaction for message ${messageReaction.messageId} is already synced`
        );
        return;
      }

      const updatedMessageReaction = await workspaceDatabase
        .updateTable('message_reactions')
        .returningAll()
        .set({
          version,
        })
        .where('message_id', '=', messageReaction.messageId)
        .where('collaborator_id', '=', messageReaction.collaboratorId)
        .where('reaction', '=', messageReaction.reaction)
        .executeTakeFirst();

      if (!updatedMessageReaction) {
        return;
      }

      this.debug(
        `Server message reaction for message ${messageReaction.messageId} has been synced`
      );
      return;
    }

    const createdMessageReaction = await workspaceDatabase
      .insertInto('message_reactions')
      .returningAll()
      .values({
        message_id: messageReaction.messageId,
        collaborator_id: messageReaction.collaboratorId,
        reaction: messageReaction.reaction,
        root_id: messageReaction.rootId,
        created_at: messageReaction.createdAt,
        version,
      })
      .executeTakeFirst();

    if (!createdMessageReaction) {
      return;
    }

    eventBus.publish({
      type: 'message_reaction_created',
      userId,
      messageReaction: mapMessageReaction(createdMessageReaction),
    });

    this.debug(
      `Server message reaction for message ${messageReaction.messageId} has been synced`
    );
  }
}

export const messageService = new MessageService();