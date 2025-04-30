import { MarkNodeSeenMutation, generateId, IdType } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  NodeMarkSeenMutationInput,
  NodeMarkSeenMutationOutput,
} from '@/shared/mutations/nodes/node-mark-seen';
import { eventBus } from '@/shared/lib/event-bus';
import { fetchNode } from '@/main/lib/utils';
import { mapNodeInteraction } from '@/main/lib/mappers';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class NodeMarkSeenMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeMarkSeenMutationInput>
{
  async handleMutation(
    input: NodeMarkSeenMutationInput
  ): Promise<NodeMarkSeenMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const node = await fetchNode(workspace.database, input.nodeId);

    if (!node) {
      return {
        success: false,
      };
    }

    const existingInteraction = await workspace.database
      .selectFrom('node_interactions')
      .selectAll()
      .where('node_id', '=', input.nodeId)
      .where('collaborator_id', '=', workspace.userId)
      .executeTakeFirst();

    if (existingInteraction) {
      const lastSeenAt = existingInteraction.last_seen_at;
      if (
        lastSeenAt &&
        lastSeenAt > new Date(Date.now() - 5 * 60 * 1000).toISOString()
      ) {
        return {
          success: true,
        };
      }
    }

    const lastSeenAt = new Date().toISOString();
    const firstSeenAt = existingInteraction
      ? existingInteraction.first_seen_at
      : lastSeenAt;

    const { createdInteraction, createdMutation } = await workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdInteraction = await trx
          .insertInto('node_interactions')
          .returningAll()
          .values({
            node_id: input.nodeId,
            collaborator_id: workspace.userId,
            last_seen_at: lastSeenAt,
            first_seen_at: firstSeenAt,
            revision: '0',
            root_id: node.rootId,
          })
          .onConflict((b) =>
            b.columns(['node_id', 'collaborator_id']).doUpdateSet({
              last_seen_at: lastSeenAt,
              first_seen_at: firstSeenAt,
            })
          )
          .executeTakeFirst();

        if (!createdInteraction) {
          throw new Error('Failed to create node interaction');
        }

        const mutation: MarkNodeSeenMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'mark_node_seen',
          data: {
            nodeId: input.nodeId,
            collaboratorId: workspace.userId,
            seenAt: new Date().toISOString(),
          },
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: mutation.id,
            type: mutation.type,
            data: JSON.stringify(mutation.data),
            created_at: mutation.createdAt,
            retries: 0,
          })
          .executeTakeFirst();

        return {
          createdInteraction,
          createdMutation,
        };
      });

    if (!createdInteraction || !createdMutation) {
      throw new Error('Failed to create node interaction');
    }

    await workspace.nodeCounters.checkCountersForUpdatedNodeInteraction(
      createdInteraction,
      existingInteraction
    );

    workspace.mutations.triggerSync();

    eventBus.publish({
      type: 'node_interaction_updated',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      nodeInteraction: mapNodeInteraction(createdInteraction),
    });

    return {
      success: true,
    };
  }
}
