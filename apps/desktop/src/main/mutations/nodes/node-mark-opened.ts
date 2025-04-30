import { MarkNodeOpenedMutation, generateId, IdType } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  NodeMarkOpenedMutationInput,
  NodeMarkOpenedMutationOutput,
} from '@/shared/mutations/nodes/node-mark-opened';
import { eventBus } from '@/shared/lib/event-bus';
import { mapNodeInteraction } from '@/main/lib/mappers';
import { fetchNode } from '@/main/lib/utils';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class NodeMarkOpenedMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeMarkOpenedMutationInput>
{
  async handleMutation(
    input: NodeMarkOpenedMutationInput
  ): Promise<NodeMarkOpenedMutationOutput> {
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
      const lastOpenedAt = existingInteraction.last_opened_at;
      if (
        lastOpenedAt &&
        lastOpenedAt > new Date(Date.now() - 5 * 60 * 1000).toISOString()
      ) {
        return {
          success: true,
        };
      }
    }

    const lastOpenedAt = new Date().toISOString();
    const firstOpenedAt = existingInteraction
      ? existingInteraction.first_opened_at
      : lastOpenedAt;

    const { createdInteraction, createdMutation } = await workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdInteraction = await trx
          .insertInto('node_interactions')
          .returningAll()
          .values({
            node_id: input.nodeId,
            collaborator_id: workspace.userId,
            last_opened_at: lastOpenedAt,
            first_opened_at: firstOpenedAt,
            revision: '0',
            root_id: node.rootId,
          })
          .onConflict((b) =>
            b.columns(['node_id', 'collaborator_id']).doUpdateSet({
              last_opened_at: lastOpenedAt,
              first_opened_at: firstOpenedAt,
            })
          )
          .executeTakeFirst();

        if (!createdInteraction) {
          throw new Error('Failed to create node interaction');
        }

        const mutation: MarkNodeOpenedMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'mark_node_opened',
          data: {
            nodeId: input.nodeId,
            collaboratorId: workspace.userId,
            openedAt: new Date().toISOString(),
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
