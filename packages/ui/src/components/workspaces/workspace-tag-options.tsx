import { eq, useLiveQuery } from '@tanstack/react-db';
import { Check, Plus, X } from 'lucide-react';
import { Fragment, useState } from 'react';

import {
  compareString,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import { WorkspaceTagSettingsPopover } from '@colanode/ui/components/workspaces/workspace-tag-settings-popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@colanode/ui/components/ui/command';
import { collections } from '@colanode/ui/collections';
import { getRandomSelectOptionColor } from '@colanode/ui/lib/databases';
import { setWorkspaceTags } from '@colanode/ui/lib/workspaces';

interface WorkspaceTagOptionsProps {
  userId: string;
  values: string[];
  onSelect: (id: string) => void;
  allowAdd: boolean;
  allowEdit: boolean;
}

export const WorkspaceTagOptions = ({
  userId,
  values,
  onSelect,
  allowAdd,
  allowEdit,
}: WorkspaceTagOptionsProps) => {
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

  const [inputValue, setInputValue] = useState('');
  const [color, setColor] = useState(getRandomSelectOptionColor());
  const showNewTag =
    allowAdd &&
    !workspaceTags.some((tag) => tag.name === inputValue.trim());

  return (
    <Command className="min-h-min">
      <CommandInput
        placeholder="Search tags..."
        className="h-9"
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandEmpty>No tags found.</CommandEmpty>
      <CommandList>
        <CommandGroup className="h-min">
          {workspaceTags.map((tag) => {
            const isSelected = values.includes(tag.id);
            return (
              <CommandItem
                key={tag.id}
                value={tag.name}
                onSelect={() => {
                  onSelect(tag.id);
                }}
                className="group flex w-full cursor-pointer flex-row items-center gap-1"
              >
                <div className="flex-1">
                  <SelectOptionBadge name={tag.name} color={tag.color} />
                </div>
                <div className="flex flex-row items-center gap-2">
                  {isSelected ? (
                    <Fragment>
                      <Check className="size-4 group-hover:hidden" />
                      <X className="hidden size-4 group-hover:block" />
                    </Fragment>
                  ) : (
                    <Plus className="hidden size-4 group-hover:block" />
                  )}
                </div>
                {allowEdit && (
                  <div
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <WorkspaceTagSettingsPopover userId={userId} tag={tag} />
                  </div>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup>
          {showNewTag && inputValue.length > 0 && (
            <CommandItem
              key={inputValue.trim()}
              value={inputValue.trim()}
              onSelect={() => {
                if (inputValue.trim().length === 0) {
                  return;
                }

                const id = generateId(IdType.Tag);
                const name = inputValue.trim();

                setWorkspaceTags(userId, (tags) => {
                  const maxIndex = Object.values(tags)
                    .map((tag) => tag.index)
                    .sort((a, b) => -compareString(a, b))[0];

                  const index = generateFractionalIndex(maxIndex, null);
                  return {
                    ...tags,
                    [id]: {
                      id,
                      index,
                      name,
                      color,
                    },
                  };
                });

                onSelect(id);
                setInputValue('');
                setColor(getRandomSelectOptionColor());
              }}
              className="flex flex-row items-center gap-2"
            >
              <span className="text-xs text-muted-foreground">Create</span>
              <SelectOptionBadge name={inputValue} color={color} />
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
