import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  NodeBacklinkItem,
  NodeBacklinksGetQueryInput,
} from '@colanode/client/queries/nodes/node-backlinks-get';
import { Event } from '@colanode/client/types/events';
import { LocalNode } from '@colanode/client/types/nodes';

export class NodeBacklinksGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<NodeBacklinksGetQueryInput>
{
  public async handleQuery(
    input: NodeBacklinksGetQueryInput
  ): Promise<NodeBacklinkItem[]> {
    return this.fetchBacklinks(input);
  }

  public async checkForChanges(
    event: Event,
    input: NodeBacklinksGetQueryInput,
    _: NodeBacklinkItem[]
  ): Promise<ChangeCheckResult<NodeBacklinksGetQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return { hasChanges: true, result: [] };
    }

    if (
      event.workspace?.userId === input.userId &&
      (event.type === 'node.reference.created' ||
        event.type === 'node.reference.deleted' ||
        event.type === 'node.created' ||
        event.type === 'node.updated' ||
        event.type === 'node.deleted')
    ) {
      return {
        hasChanges: true,
        result: await this.fetchBacklinks(input),
      };
    }

    return { hasChanges: false };
  }

  private async fetchBacklinks(
    input: NodeBacklinksGetQueryInput
  ): Promise<NodeBacklinkItem[]> {
    const workspace = this.getWorkspace(input.userId);

    const refs = await workspace.database
      .selectFrom('node_references')
      .select(['node_id'])
      .where('reference_id', '=', input.nodeId)
      .where('node_id', '!=', input.nodeId)
      .execute();

    if (refs.length === 0) {
      return [];
    }

    const counts = new Map<string, number>();
    for (const r of refs) {
      counts.set(r.node_id, (counts.get(r.node_id) ?? 0) + 1);
    }

    const sourceIds = Array.from(counts.keys());
    const sources = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', 'in', sourceIds)
      .execute();

    const parentIds = Array.from(
      new Set(
        sources
          .map((n) => n.parent_id)
          .filter((id): id is string => !!id)
      )
    );
    const parents = parentIds.length
      ? await workspace.database
          .selectFrom('nodes')
          .selectAll()
          .where('id', 'in', parentIds)
          .execute()
      : [];
    const parentMap = new Map(parents.map((p) => [p.id, mapNode(p)]));

    return sources.map((row) => {
      const source = mapNode(row) as LocalNode;
      const parent =
        row.parent_id && parentMap.get(row.parent_id)
          ? (parentMap.get(row.parent_id) as LocalNode)
          : null;
      return {
        source,
        parent,
        count: counts.get(row.id) ?? 1,
      };
    });
  }
}
