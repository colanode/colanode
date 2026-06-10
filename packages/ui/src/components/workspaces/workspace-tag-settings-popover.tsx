import { debounceStrategy, usePacedMutations } from '@tanstack/react-db';
import { Ellipsis, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Workspace } from '@colanode/client/types';
import { TagAttributes } from '@colanode/core';
import { Input } from '@colanode/ui/components/ui/input';
import { Label } from '@colanode/ui/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { collections } from '@colanode/ui/collections';
import { selectOptionColors } from '@colanode/ui/lib/databases';
import { applyWorkspaceTagsTransaction, setWorkspaceTags } from '@colanode/ui/lib/workspaces';
import { cn } from '@colanode/ui/lib/utils';

interface WorkspaceTagSettingsPopoverProps {
  userId: string;
  tag: TagAttributes;
}

export const WorkspaceTagSettingsPopover = ({
  userId,
  tag,
}: WorkspaceTagSettingsPopoverProps) => {
  const mutateName = usePacedMutations<string, Workspace>({
    onMutate: (newName) => {
      collections.workspaces.update(userId, (draft) => {
        const tags = { ...(draft.tags ?? {}) };
        const existing = tags[tag.id];
        if (!existing) {
          return;
        }

        tags[tag.id] = { ...existing, name: newName };
        draft.tags = tags;
      });
    },
    mutationFn: async ({ transaction }) => {
      await applyWorkspaceTagsTransaction(transaction);
    },
    strategy: debounceStrategy({ wait: 500 }),
  });

  const [openSettingsPopover, setOpenSettingsPopover] = useState(false);

  const handleDelete = () => {
    setWorkspaceTags(userId, (tags) => {
      const nextTags = { ...tags };
      delete nextTags[tag.id];
      return nextTags;
    });
    setOpenSettingsPopover(false);
  };

  return (
    <Popover
      modal={true}
      open={openSettingsPopover}
      onOpenChange={setOpenSettingsPopover}
    >
      <PopoverTrigger className="flex cursor-pointer items-center justify-center">
        <Ellipsis className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
        <div className="p-1">
          <Input
            value={tag.name}
            onChange={(event) => {
              const newName = event.target.value;
              if (newName === tag.name) return;

              mutateName(newName);
            }}
          />
        </div>
        <Separator className="my-1" />
        <Label>Color</Label>
        {selectOptionColors.map((color) => {
          return (
            <div
              key={color.value}
              className="flex cursor-pointer flex-row items-center gap-2 rounded-md p-1 hover:bg-accent"
              onClick={() => {
                setWorkspaceTags(userId, (tags) => {
                  const existing = tags[tag.id];
                  if (!existing) {
                    return tags;
                  }

                  return {
                    ...tags,
                    [tag.id]: { ...existing, color: color.value },
                  };
                });
              }}
            >
              <span className={cn('h-4 w-4 rounded-md', color.class)} />
              <span>{color.label}</span>
            </div>
          );
        })}
        <Separator className="my-1" />
        <div
          className="flex cursor-pointer flex-row items-center gap-2 rounded-md p-1 hover:bg-accent"
          onClick={handleDelete}
        >
          <Trash2 className="size-4" />
          <span>Delete tag</span>
        </div>
      </PopoverContent>
    </Popover>
  );
};
