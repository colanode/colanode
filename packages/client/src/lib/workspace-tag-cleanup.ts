import { createDebugger, NodeAttributes } from '@colanode/core';

import { extractTagIds } from '@colanode/client/lib/tags';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';

const debug = createDebugger('desktop:workspace-tag-cleanup');

const TAGGABLE_NODE_TYPES = ['page', 'channel', 'folder', 'database'] as const;

export const cleanupDeletedWorkspaceTags = async (
  workspace: WorkspaceService,
  removedTagIds: string[]
): Promise<void> => {
  if (removedTagIds.length === 0) {
    return;
  }

  const removedTagIdSet = new Set(removedTagIds);

  const nodes = await workspace.database
    .selectFrom('nodes')
    .select(['id', 'attributes'])
    .where('type', 'in', [...TAGGABLE_NODE_TYPES])
    .execute();

  for (const node of nodes) {
    const attributes = JSON.parse(node.attributes) as NodeAttributes;
    const tagIds = extractTagIds(attributes);
    const nextTagIds = tagIds.filter((tagId) => !removedTagIdSet.has(tagId));

    if (nextTagIds.length === tagIds.length) {
      continue;
    }

    debug(`Removing deleted tags from node ${node.id}`);

    await workspace.nodes.updateNode(node.id, (draft) => {
      switch (draft.type) {
        case 'page':
        case 'channel':
        case 'folder':
        case 'database':
          if (nextTagIds.length === 0) {
            delete draft.tagIds;
          } else {
            draft.tagIds = nextTagIds;
          }
          break;
      }

      return draft;
    });
  }
};
