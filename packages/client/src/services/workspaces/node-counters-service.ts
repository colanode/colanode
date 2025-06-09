import AsyncLock from 'async-lock';
import { sql } from 'kysely';

import {
  SelectNode,
  SelectNodeCounter,
  SelectNodeInteraction,
  SelectNodeReference,
} from '@colanode/client/databases/workspace';
import { eventBus } from '@colanode/client/lib/event-bus';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { NodeCounterType } from '@colanode/client/types/nodes';
import { getIdType, IdType, MentionConstants } from '@colanode/core';

export class NodeCountersService {
  private readonly workspace: WorkspaceService;
  private readonly lock = new AsyncLock();

  constructor(workspace: WorkspaceService) {
    this.workspace = workspace;
  }

  public async checkCountersForCreatedNode(
    node: SelectNode,
    references: SelectNodeReference[]
  ) {
    // Only messages have counters for now
    if (
      node.type !== 'message' ||
      !node.parent_id ||
      node.created_by === this.workspace.userId
    ) {
      return;
    }

    const isMentioned = this.isUserMentioned(references);
    const counters = await this.lock.acquire(
      this.getLockKey(node.id),
      async () => {
        if (!node.parent_id) {
          return;
        }

        const nodeInteraction = await this.workspace.database
          .selectFrom('node_interactions')
          .selectAll()
          .where('node_id', '=', node.id)
          .where('collaborator_id', '=', this.workspace.userId)
          .executeTakeFirst();

        if (nodeInteraction?.last_seen_at) {
          return;
        }

        const collaboration = this.workspace.collaborations.getCollaboration(
          node.root_id
        );

        if (!collaboration || collaboration.created_at > node.created_at) {
          return;
        }

        const parentIdType = getIdType(node.parent_id);
        const types: NodeCounterType[] = [];
        if (isMentioned) {
          types.push('unread.mentions');
        } else if (parentIdType === IdType.Channel) {
          types.push('unread.messages.silent');
        } else if (parentIdType === IdType.Chat) {
          types.push('unread.messages.important');
        }

        if (types.length > 0) {
          return await this.increaseCounters(node.parent_id, types);
        }
      }
    );

    if (counters) {
      for (const counter of counters) {
        eventBus.publish({
          type: 'node.counter.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          counter: {
            nodeId: counter.node_id,
            type: counter.type,
            count: counter.count,
          },
        });
      }
    }
  }

  public async checkCountersForDeletedNode(node: SelectNode) {
    if (node.type !== 'message' || !node.parent_id) {
      return;
    }

    const counters = await this.lock.acquire(
      this.getLockKey(node.id),
      async () => {
        if (!node.parent_id) {
          return;
        }

        return await this.deleteCounters(node.parent_id);
      }
    );

    if (counters) {
      for (const counter of counters) {
        eventBus.publish({
          type: 'node.counter.deleted',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          counter: {
            nodeId: counter.node_id,
            type: counter.type,
            count: counter.count,
          },
        });
      }
    }
  }

  public async checkCountersForUpdatedNodeInteraction(
    nodeInteraction: SelectNodeInteraction,
    previousNodeInteraction?: SelectNodeInteraction
  ) {
    if (nodeInteraction.collaborator_id !== this.workspace.userId) {
      return;
    }

    // If the node interaction has not been seen, we don't need to check the counters
    if (!nodeInteraction.last_seen_at) {
      return;
    }

    // If the previous node interaction has already been seen, we don't need to check the counters
    if (previousNodeInteraction?.last_seen_at) {
      return;
    }

    const counters = await this.lock.acquire(
      this.getLockKey(nodeInteraction.node_id),
      async () => {
        const node = await this.workspace.database
          .selectFrom('nodes')
          .selectAll()
          .where('id', '=', nodeInteraction.node_id)
          .executeTakeFirst();

        if (
          !node ||
          !node.parent_id ||
          node.created_by === this.workspace.userId
        ) {
          return;
        }

        const collaboration = this.workspace.collaborations.getCollaboration(
          node.root_id
        );

        if (!collaboration || collaboration.created_at > node.created_at) {
          return;
        }

        const nodeReferences = await this.workspace.database
          .selectFrom('node_references')
          .selectAll()
          .where('node_id', '=', nodeInteraction.node_id)
          .execute();

        const isMentioned = this.isUserMentioned(nodeReferences);
        const parentIdType = getIdType(node.parent_id);
        const types: NodeCounterType[] = [];

        if (isMentioned) {
          types.push('unread.mentions');
        } else if (parentIdType === IdType.Channel) {
          types.push('unread.messages.silent');
        } else if (parentIdType === IdType.Chat) {
          types.push('unread.messages.important');
        }

        if (types.length > 0) {
          return await this.decreaseCounters(node.parent_id, types);
        }
      }
    );

    if (counters) {
      for (const counter of counters) {
        eventBus.publish({
          type: 'node.counter.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          counter: {
            nodeId: counter.node_id,
            type: counter.type,
            count: counter.count,
          },
        });
      }
    }
  }

  private async increaseCounters(
    nodeId: string,
    types: NodeCounterType[]
  ): Promise<SelectNodeCounter[] | undefined> {
    return await this.workspace.database
      .insertInto('node_counters')
      .returningAll()
      .values(
        types.map((type) => ({
          node_id: nodeId,
          type,
          created_at: new Date().toISOString(),
          count: 1,
        }))
      )
      .onConflict((oc) =>
        oc.columns(['node_id', 'type']).doUpdateSet({
          count: sql`node_counters.count + 1`,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }

  private async decreaseCounters(
    nodeId: string,
    types: NodeCounterType[]
  ): Promise<SelectNodeCounter[] | undefined> {
    return await this.workspace.database
      .updateTable('node_counters')
      .returningAll()
      .set({
        count: sql`node_counters.count - 1`,
        updated_at: new Date().toISOString(),
      })
      .where('node_id', '=', nodeId)
      .where('type', 'in', types)
      .execute();
  }

  private async deleteCounters(nodeId: string) {
    return await this.workspace.database
      .deleteFrom('node_counters')
      .returningAll()
      .where('node_id', '=', nodeId)
      .execute();
  }

  private isUserMentioned(references: SelectNodeReference[]) {
    return references.some(
      (reference) =>
        reference.reference_id === this.workspace.userId ||
        reference.reference_id === MentionConstants.Everyone
    );
  }

  private getLockKey(nodeId: string) {
    return `node_counters_${nodeId}`;
  }
}
