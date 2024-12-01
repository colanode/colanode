import {
  InteractionAttributes,
  InteractionEvent,
  mergeInteractionAttributes,
  SyncInteractionsMessage,
} from '@colanode/core';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

const UPDATE_RETRIES_COUNT = 10;

class InteractionService {
  public async syncLocalInteractions(
    accountId: string,
    message: SyncInteractionsMessage
  ) {
    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('id', '=', message.userId)
      .executeTakeFirst();

    if (!workspaceUser || workspaceUser.account_id !== accountId) {
      return false;
    }

    for (let i = 0; i < UPDATE_RETRIES_COUNT; i++) {
      const synced = await this.trySyncInteraction(
        workspaceUser.workspace_id,
        message
      );

      if (synced) {
        return true;
      }
    }

    return false;
  }

  private async trySyncInteraction(
    workspaceId: string,
    message: SyncInteractionsMessage
  ): Promise<boolean> {
    if (message.events.length === 0) {
      return true;
    }

    const firstEvent = message.events[0];
    if (!firstEvent) {
      return true;
    }

    const lastEvent = message.events[message.events.length - 1];
    if (!lastEvent) {
      return true;
    }

    const interaction = await database
      .selectFrom('interactions')
      .selectAll()
      .where('user_id', '=', message.userId)
      .where('node_id', '=', message.nodeId)
      .executeTakeFirst();

    const attributes = this.buildInteractionAttributes(
      interaction?.attributes,
      message.events
    );

    if (!attributes) {
      return true;
    }

    if (interaction) {
      const updatedInteraction = await database
        .updateTable('interactions')
        .returningAll()
        .set({
          attributes: JSON.stringify(attributes),
          updated_at: new Date(lastEvent.createdAt),
          server_updated_at: new Date(),
        })
        .where('user_id', '=', message.userId)
        .where('node_id', '=', message.nodeId)
        .where('version', '=', interaction.version)
        .executeTakeFirst();

      if (updatedInteraction) {
        eventBus.publish({
          type: 'interaction_updated',
          userId: message.userId,
          nodeId: message.nodeId,
          nodeType: message.nodeType,
          workspaceId,
        });

        return true;
      }
    }

    const createdInteraction = await database
      .insertInto('interactions')
      .returningAll()
      .values({
        user_id: message.userId,
        node_id: message.nodeId,
        node_type: message.nodeType,
        workspace_id: workspaceId,
        attributes: JSON.stringify(attributes),
        created_at: new Date(firstEvent.createdAt),
        server_created_at: new Date(),
      })
      .onConflict((oc) => oc.columns(['user_id', 'node_id']).doNothing())
      .executeTakeFirst();

    if (createdInteraction) {
      eventBus.publish({
        type: 'interaction_updated',
        userId: message.userId,
        nodeId: message.nodeId,
        nodeType: message.nodeType,
        workspaceId,
      });

      return true;
    }

    return false;
  }

  private buildInteractionAttributes(
    attributes: InteractionAttributes | undefined,
    events: InteractionEvent[]
  ): InteractionAttributes | null {
    if (events.length === 0) {
      return null;
    }

    let result = { ...attributes };
    for (const event of events) {
      const merged = mergeInteractionAttributes(
        result,
        event.attribute,
        event.value
      );
      if (merged) {
        result = merged;
      }
    }

    return result;
  }
}

export const interactionService = new InteractionService();
