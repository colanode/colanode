import { OperationType, TransactionWithMutations } from '@tanstack/react-db';

import { Workspace } from '@colanode/client/types';
import { TagAttributes } from '@colanode/core';
import { collections } from '@colanode/ui/collections';

export const applyWorkspaceTagsTransaction = async (
  transaction: TransactionWithMutations<Workspace, OperationType>
) => {
  for (const mutation of transaction.mutations) {
    if (mutation.type !== 'update') {
      continue;
    }

    await window.colanode.executeMutation({
      type: 'workspace.tags.update',
      userId: mutation.modified.userId,
      tags: mutation.modified.tags ?? {},
    });
  }
};

export const setWorkspaceTags = (
  userId: string,
  updater: (tags: Record<string, TagAttributes>) => Record<string, TagAttributes>
) => {
  const workspace = collections.workspaces.get(userId);
  if (!workspace) {
    return;
  }

  const nextTags = updater(workspace.tags ?? {});

  collections.workspaces.update(userId, (draft) => {
    draft.tags = nextTags;
  });
};
