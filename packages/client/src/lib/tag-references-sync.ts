import { applyTagUpdates, checkTagChanges, extractTagIds } from '@colanode/client/lib/tags';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { NodeAttributes } from '@colanode/core';

const TAGGABLE_NODE_TYPES = ['page', 'channel', 'folder', 'database'] as const;

export const syncTagReferences = async (
  workspace: WorkspaceService
): Promise<void> => {
  const nodes = await workspace.database
    .selectFrom('nodes')
    .select(['id', 'attributes'])
    .where('type', 'in', [...TAGGABLE_NODE_TYPES])
    .execute();

  const syncedAt = new Date().toISOString();

  for (const node of nodes) {
    const attributes = JSON.parse(node.attributes) as NodeAttributes;
    const tagIds = extractTagIds(attributes);

    const existingRefs = await workspace.database
      .selectFrom('node_references')
      .select(['reference_id'])
      .where('node_id', '=', node.id)
      .where('type', '=', 'tag')
      .execute();

    const existingTagIds = existingRefs.map((ref) => ref.reference_id);
    const changes = checkTagChanges(existingTagIds, tagIds);

    if (changes.addedTags.length === 0 && changes.removedTags.length === 0) {
      continue;
    }

    await workspace.database.transaction().execute(async (trx) => {
      await applyTagUpdates(
        trx,
        node.id,
        workspace.userId,
        syncedAt,
        changes
      );
    });
  }
};
