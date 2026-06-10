import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  TagNodeItem,
  TagNodesListQueryInput,
} from '@colanode/client/queries/tags/tag-nodes-list';
import { Event } from '@colanode/client/types/events';
import { LocalNode } from '@colanode/client/types/nodes';

export class TagNodesListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<TagNodesListQueryInput>
{
  public async handleQuery(
    input: TagNodesListQueryInput
  ): Promise<TagNodeItem[]> {
    return this.fetchTaggedNodes(input);
  }

  public async checkForChanges(
    event: Event,
    input: TagNodesListQueryInput,
    _: TagNodeItem[]
  ): Promise<ChangeCheckResult<TagNodesListQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return { hasChanges: true, result: [] };
    }

    if (
      (event.type === 'node.reference.created' ||
        event.type === 'node.reference.deleted' ||
        event.type === 'node.created' ||
        event.type === 'node.updated' ||
        event.type === 'node.deleted') &&
      event.workspace.userId === input.userId
    ) {
      if (
        (event.type === 'node.reference.created' ||
          event.type === 'node.reference.deleted') &&
        event.nodeReference.referenceId !== input.tagId
      ) {
        return { hasChanges: false };
      }

      return {
        hasChanges: true,
        result: await this.fetchTaggedNodes(input),
      };
    }

    return { hasChanges: false };
  }

  private async fetchTaggedNodes(
    input: TagNodesListQueryInput
  ): Promise<TagNodeItem[]> {
    const workspace = this.getWorkspace(input.userId);

    const refs = await workspace.database
      .selectFrom('node_references')
      .select(['node_id'])
      .where('reference_id', '=', input.tagId)
      .where('type', '=', 'tag')
      .execute();

    if (refs.length === 0) {
      return [];
    }

    const nodeIds = refs.map((ref) => ref.node_id);
    const nodes = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', 'in', nodeIds)
      .execute();

    const parentIds = Array.from(
      new Set(
        nodes
          .map((node) => node.parent_id)
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
    const parentMap = new Map(parents.map((parent) => [parent.id, mapNode(parent)]));

    return nodes.map((row) => {
      const node = mapNode(row) as LocalNode;
      const parent =
        row.parent_id && parentMap.get(row.parent_id)
          ? (parentMap.get(row.parent_id) as LocalNode)
          : null;

      return { node, parent };
    });
  }
}
