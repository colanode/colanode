import { eq, useLiveQuery } from '@tanstack/react-db';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { LocalPageNode } from '@colanode/client/types';
import { TagAttributes } from '@colanode/core';
import { TagLink } from '@colanode/ui/components/tags/tag-link';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { WorkspaceTagOptions } from '@colanode/ui/components/workspaces/workspace-tag-options';
import { collections } from '@colanode/ui/collections';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface NodeTagBarProps {
  page: LocalPageNode;
  canEdit?: boolean;
}

export const NodeTagBar = ({ page, canEdit = false }: NodeTagBarProps) => {
  const workspace = useWorkspace();
  const [open, setOpen] = useState(false);

  const workspaceTagsQuery = useLiveQuery(
    (q) =>
      q
        .from({ workspaces: collections.workspaces })
        .where(({ workspaces }) => eq(workspaces.userId, workspace.userId))
        .select(({ workspaces }) => ({
          tags: workspaces.tags,
        })),
    [workspace.userId]
  );

  if (workspaceTagsQuery.isLoading) {
    return null;
  }

  const workspaceTags = workspaceTagsQuery.data?.[0]?.tags ?? {};
  const tagIds = page.tagIds ?? [];

  const matchedTags = tagIds
    .map((id) => workspaceTags[id])
    .filter((tag): tag is TagAttributes => !!tag);

  if (!canEdit && matchedTags.length === 0) {
    return null;
  }

  const handleSelect = (id: string) => {
    if (!canEdit) {
      return;
    }

    workspace.collections.nodes.update(page.id, (draft) => {
      if (draft.type !== 'page') {
        return;
      }

      const currentIds = draft.tagIds ?? [];
      const newIds = currentIds.includes(id)
        ? currentIds.filter((tagId) => tagId !== id)
        : [...currentIds, id];

      if (newIds.length === 0) {
        delete draft.tagIds;
      } else {
        draft.tagIds = newIds;
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-2">
      {matchedTags.map((tag) => (
        <TagLink key={tag.id} tag={tag} userId={workspace.userId} />
      ))}
      {canEdit && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {matchedTags.length === 0 ? (
              <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                <Plus className="size-3" />
                Add tags
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                aria-label="Edit tags"
              >
                <Plus className="size-3.5" />
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-1">
            <WorkspaceTagOptions
              userId={workspace.userId}
              values={tagIds}
              onSelect={handleSelect}
              allowAdd={true}
              allowEdit={false}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
