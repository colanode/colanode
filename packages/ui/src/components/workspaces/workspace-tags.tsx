import { eq, useLiveQuery } from '@tanstack/react-db';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { TagLink } from '@colanode/ui/components/tags/tag-link';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { WorkspaceTagOptions } from '@colanode/ui/components/workspaces/workspace-tag-options';
import { collections } from '@colanode/ui/collections';

interface WorkspaceTagsProps {
  userId: string;
  canEdit: boolean;
}

export const WorkspaceTags = ({ userId, canEdit }: WorkspaceTagsProps) => {
  const [open, setOpen] = useState(false);

  const tagsQuery = useLiveQuery(
    (q) =>
      q
        .from({ workspaces: collections.workspaces })
        .where(({ workspaces }) => eq(workspaces.userId, userId))
        .select(({ workspaces }) => ({
          tags: workspaces.tags,
        }))
        .findOne(),
    [userId]
  );

  const workspaceTags = Object.values(tagsQuery.data?.tags ?? {});

  return (
    <div className="space-y-4">
      {workspaceTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {workspaceTags.map((tag) => (
            <TagLink key={tag.id} tag={tag} userId={userId} />
          ))}
        </div>
      )}

      {canEdit && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-4" />
              {workspaceTags.length === 0 ? 'Add tags' : 'Manage tags'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-1">
            <WorkspaceTagOptions
              userId={userId}
              values={[]}
              onSelect={() => {}}
              allowAdd={true}
              allowEdit={true}
            />
          </PopoverContent>
        </Popover>
      )}

      {!canEdit && workspaceTags.length === 0 && (
        <p className="text-sm text-muted-foreground">No tags defined.</p>
      )}
    </div>
  );
};
