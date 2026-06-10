import { SelectWorkspace } from '@colanode/client/databases/app';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapWorkspace } from '@colanode/client/lib/mappers';
import { AppService } from '@colanode/client/services/app-service';
import { TagAttributes } from '@colanode/core';

export const migrateLegacySpaceTags = async (
  app: AppService,
  workspaceRow: SelectWorkspace
): Promise<void> => {
  const existingTags: Record<string, TagAttributes> = workspaceRow.tags
    ? JSON.parse(workspaceRow.tags)
    : {};

  if (Object.keys(existingTags).length > 0) {
    return;
  }

  const workspaceService = app.getWorkspace(workspaceRow.user_id);
  if (!workspaceService) {
    return;
  }

  const spaces = await workspaceService.database
    .selectFrom('nodes')
    .selectAll()
    .where('type', '=', 'space')
    .execute();

  const mergedTags: Record<string, TagAttributes> = {};

  for (const space of spaces) {
    const attributes = JSON.parse(space.attributes) as {
      tags?: Record<string, TagAttributes>;
    };

    if (!attributes.tags) {
      continue;
    }

    Object.assign(mergedTags, attributes.tags);
  }

  if (Object.keys(mergedTags).length === 0) {
    return;
  }

  const updatedWorkspace = await app.database
    .updateTable('workspaces')
    .returningAll()
    .set({
      tags: JSON.stringify(mergedTags),
      updated_at: new Date().toISOString(),
    })
    .where('user_id', '=', workspaceRow.user_id)
    .executeTakeFirst();

  if (!updatedWorkspace) {
    return;
  }

  const workspace = mapWorkspace(updatedWorkspace);
  workspaceService.updateWorkspace(workspace);

  eventBus.publish({
    type: 'workspace.updated',
    workspace,
  });
};
