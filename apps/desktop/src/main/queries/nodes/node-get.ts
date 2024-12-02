import { Node } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectNode } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import { NodeGetQueryInput } from '@/shared/queries/nodes/node-get';
import { Event } from '@/shared/types/events';

export class NodeGetQueryHandler implements QueryHandler<NodeGetQueryInput> {
  public async handleQuery(input: NodeGetQueryInput): Promise<Node | null> {
    const row = await this.fetchNode(input);
    return row ? mapNode(row) : null;
  }

  public async checkForChanges(
    event: Event,
    input: NodeGetQueryInput,
    _: Node | null
  ): Promise<ChangeCheckResult<NodeGetQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'node_created' &&
      event.userId === input.userId &&
      event.node.id === input.nodeId
    ) {
      return {
        hasChanges: true,
        result: event.node,
      };
    }

    if (
      event.type === 'node_updated' &&
      event.userId === input.userId &&
      event.node.id === input.nodeId
    ) {
      return {
        hasChanges: true,
        result: event.node,
      };
    }

    if (
      event.type === 'node_deleted' &&
      event.userId === input.userId &&
      event.node.id === input.nodeId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchNode(
    input: NodeGetQueryInput
  ): Promise<SelectNode | undefined> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const row = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.nodeId)
      .executeTakeFirst();

    return row;
  }
}
