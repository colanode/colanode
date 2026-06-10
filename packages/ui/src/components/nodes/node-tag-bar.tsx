import { eq, useLiveQuery } from '@tanstack/react-db';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import {
  LocalChannelNode,
  LocalDatabaseNode,
  LocalFolderNode,
  LocalPageNode,
} from '@colanode/client/types';
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

type TaggableNode =
  | LocalPageNode
  | LocalChannelNode
  | LocalFolderNode
  | LocalDatabaseNode;

interface NodeTagBarProps {
  node: TaggableNode;
  canEdit?: boolean;
}

export const NodeTagBar = ({ node, canEdit = false }: NodeTagBarProps) => {
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
  const tagIds = node.tagIds ?? [];

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

    workspace.collections.nodes.update(node.id, (draft) => {
      switch (draft.type) {
        case 'page':
        case 'channel':
        case 'folder':
        case 'database': {
          const currentIds = draft.tagIds ?? [];
          const newIds = currentIds.includes(id)
            ? currentIds.filter((tagId: string) => tagId !== id)
            : [...currentIds, id];

          if (newIds.length === 0) {
            delete draft.tagIds;
          } else {
            draft.tagIds = newIds;
          }
          break;
        }
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
