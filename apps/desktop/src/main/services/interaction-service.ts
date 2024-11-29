import {
  generateId,
  IdType,
  InteractionAttribute,
  InteractionAttributes,
  mergeInteractionAttributes,
  NodeType,
  ServerInteraction,
} from '@colanode/core';
import { databaseService } from '@/main/data/database-service';
import { SelectInteractionEvent } from '@/main/data/workspace/schema';
import { eventBus } from '@/shared/lib/event-bus';

const UPDATE_RETRIES_COUNT = 10;

type ServerAttributesMergeResult = {
  attributes: InteractionAttributes;
  toDeleteEventIds: string[];
};

class InteractionService {
  public async setInteraction(
    userId: string,
    nodeId: string,
    nodeType: NodeType,
    attribute: InteractionAttribute,
    value: string
  ) {
    for (let i = 0; i < UPDATE_RETRIES_COUNT; i++) {
      const updated = await this.tryUpdateInteraction(
        userId,
        nodeId,
        nodeType,
        attribute,
        value
      );

      if (updated) {
        return true;
      }
    }

    return false;
  }

  private async tryUpdateInteraction(
    userId: string,
    nodeId: string,
    nodeType: NodeType,
    attribute: InteractionAttribute,
    value: string
  ): Promise<boolean> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const interaction = await workspaceDatabase
      .selectFrom('interactions')
      .selectAll()
      .where('node_id', '=', nodeId)
      .executeTakeFirst();

    const attributes = mergeInteractionAttributes(
      interaction?.attributes,
      attribute,
      value
    );

    if (!attributes) {
      return true;
    }

    if (interaction) {
      const result = await workspaceDatabase
        .transaction()
        .execute(async (tx) => {
          const updatedInteraction = await tx
            .updateTable('interactions')
            .returningAll()
            .set({
              attributes: JSON.stringify(attributes),
              updated_at: new Date().toISOString(),
            })
            .where('node_id', '=', nodeId)
            .where('user_id', '=', userId)
            .where('version', '=', interaction.version)
            .executeTakeFirst();

          if (!updatedInteraction) {
            return false;
          }

          await tx
            .insertInto('interaction_events')
            .values({
              node_id: nodeId,
              node_type: nodeType,
              attribute,
              value,
              created_at: new Date().toISOString(),
              event_id: generateId(IdType.Event),
            })
            .onConflict((b) =>
              b.columns(['node_id', 'attribute']).doUpdateSet({
                value,
                sent_at: null,
                event_id: generateId(IdType.Event),
              })
            )
            .execute();

          return true;
        });

      if (result) {
        eventBus.publish({
          type: 'interaction_event_created',
          userId,
          nodeId,
        });
      }

      return result;
    }

    const result = await workspaceDatabase.transaction().execute(async (tx) => {
      const createdInteraction = await tx
        .insertInto('interactions')
        .returningAll()
        .values({
          node_id: nodeId,
          node_type: nodeType,
          user_id: userId,
          attributes: JSON.stringify(attributes),
          created_at: new Date().toISOString(),
          version: BigInt(0),
        })
        .onConflict((b) => b.columns(['node_id', 'user_id']).doNothing())
        .executeTakeFirst();

      if (!createdInteraction) {
        return false;
      }

      await tx
        .insertInto('interaction_events')
        .values({
          node_id: nodeId,
          node_type: nodeType,
          attribute,
          value,
          created_at: new Date().toISOString(),
          event_id: generateId(IdType.Event),
        })
        .onConflict((b) =>
          b.columns(['node_id', 'attribute']).doUpdateSet({
            value,
            sent_at: null,
            event_id: generateId(IdType.Event),
          })
        )
        .execute();

      return true;
    });

    if (result) {
      eventBus.publish({
        type: 'interaction_event_created',
        userId,
        nodeId,
      });
    }

    return result;
  }

  public async applyServerInteraction(
    userId: string,
    interaction: ServerInteraction
  ) {
    if (interaction.userId !== userId) {
      await this.replaceInteraction(userId, interaction);
      return true;
    }

    for (let i = 0; i < UPDATE_RETRIES_COUNT; i++) {
      const updated = await this.tryApplyServerInteraction(userId, interaction);

      if (updated) {
        return true;
      }
    }

    return false;
  }

  private async replaceInteraction(
    userId: string,
    interaction: ServerInteraction
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('interactions')
      .values({
        user_id: interaction.userId,
        node_id: interaction.nodeId,
        node_type: interaction.nodeType,
        attributes: JSON.stringify(interaction.attributes),
        created_at: interaction.createdAt,
        updated_at: interaction.updatedAt,
        server_created_at: interaction.serverCreatedAt,
        server_updated_at: interaction.serverUpdatedAt,
        version: BigInt(interaction.version),
      })
      .onConflict((b) =>
        b.columns(['node_id', 'user_id']).doUpdateSet({
          attributes: JSON.stringify(interaction.attributes),
          updated_at: interaction.updatedAt,
          server_updated_at: interaction.serverUpdatedAt,
          version: BigInt(interaction.version),
        })
      )
      .execute();
  }

  private async tryApplyServerInteraction(
    userId: string,
    interaction: ServerInteraction
  ): Promise<boolean> {
    console.log('trying to apply server interaction', interaction);
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingInteraction = await workspaceDatabase
      .selectFrom('interactions')
      .selectAll()
      .where('node_id', '=', interaction.nodeId)
      .executeTakeFirst();

    const interactionEvents = await workspaceDatabase
      .selectFrom('interaction_events')
      .selectAll()
      .where('node_id', '=', interaction.nodeId)
      .execute();

    const { attributes, toDeleteEventIds } = this.mergeServerAttributes(
      interaction.attributes,
      interactionEvents
    );

    if (existingInteraction) {
      const result = await workspaceDatabase
        .transaction()
        .execute(async (tx) => {
          const updatedInteraction = await tx
            .updateTable('interactions')
            .returningAll()
            .set({
              attributes: JSON.stringify(attributes),
              updated_at: interaction.updatedAt,
              server_updated_at: interaction.serverUpdatedAt,
              version: BigInt(interaction.version),
            })
            .where('node_id', '=', interaction.nodeId)
            .where('user_id', '=', userId)
            .where('version', '=', existingInteraction.version)
            .executeTakeFirst();

          if (!updatedInteraction) {
            return false;
          }

          if (toDeleteEventIds.length > 0) {
            await tx
              .deleteFrom('interaction_events')
              .where('node_id', '=', interaction.nodeId)
              .where('event_id', 'in', toDeleteEventIds)
              .execute();
          }

          return true;
        });

      return result;
    }

    const result = await workspaceDatabase.transaction().execute(async (tx) => {
      const createdInteraction = await tx
        .insertInto('interactions')
        .returningAll()
        .values({
          user_id: interaction.userId,
          node_id: interaction.nodeId,
          node_type: interaction.nodeType,
          attributes: JSON.stringify(attributes),
          created_at: interaction.createdAt,
          updated_at: interaction.updatedAt,
          server_created_at: interaction.serverCreatedAt,
          server_updated_at: interaction.serverUpdatedAt,
          version: BigInt(interaction.version),
        })
        .onConflict((b) => b.columns(['node_id', 'user_id']).doNothing())
        .executeTakeFirst();

      if (!createdInteraction) {
        return false;
      }

      if (toDeleteEventIds.length > 0) {
        await tx
          .deleteFrom('interaction_events')
          .where('node_id', '=', interaction.nodeId)
          .where('event_id', 'in', toDeleteEventIds)
          .execute();
      }

      return true;
    });

    return result;
  }

  private mergeServerAttributes(
    attributes: InteractionAttributes,
    events: SelectInteractionEvent[]
  ): ServerAttributesMergeResult {
    if (events.length === 0) {
      return { attributes, toDeleteEventIds: [] };
    }

    let result = { ...attributes };
    const toDeleteEventIds: string[] = [];

    for (const event of events) {
      const merged = mergeInteractionAttributes(
        result,
        event.attribute,
        event.value
      );

      if (merged) {
        result = merged;
      } else {
        toDeleteEventIds.push(event.event_id);
      }
    }

    return { attributes: result, toDeleteEventIds };
  }
}

export const interactionService = new InteractionService();