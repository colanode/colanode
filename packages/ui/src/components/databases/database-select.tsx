import { eq, useLiveQuery } from '@tanstack/react-db';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Fragment, useState } from 'react';

import { DatabaseAttributes } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@colanode/ui/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';
import { cn } from '@colanode/ui/lib/utils';

interface DatabaseSelectProps {
  id: string | null | undefined;
  onChange: (id: string) => void;
}

export const DatabaseSelect = ({ id, onChange }: DatabaseSelectProps) => {
  const workspace = useWorkspace();
  const [open, setOpen] = useState(false);

  const databaseListQuery = useLiveQuery((q) =>
    q
      .from({ nodes: database.workspace(workspace.userId).nodes })
      .where(({ nodes }) => eq(nodes.type, 'database'))
      .select(({ nodes }) => ({
        id: nodes.id,
        attributes: nodes.attributes,
      }))
  );

  const databases =
    databaseListQuery.data.map((node) => {
      const attributes = node.attributes as DatabaseAttributes;
      return {
        id: node.id,
        name: attributes.name,
        avatar: attributes.avatar,
      };
    }) ?? [];

  const selectedDatabase = id
    ? databases.find((database) => database.id === id)
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between p-2"
        >
          {selectedDatabase ? (
            <Fragment>
              <span className="flex flex-row items-center gap-1">
                <Avatar
                  id={selectedDatabase.id}
                  name={selectedDatabase.name}
                  avatar={selectedDatabase.avatar}
                  className="size-4"
                />
                {selectedDatabase.name}
              </span>
            </Fragment>
          ) : (
            <span>Select database...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1 overflow-hidden">
        <Command className="min-h-min">
          <CommandInput placeholder="Search field types..." className="h-9" />
          <CommandEmpty>No field type found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min overflow-y-auto">
              {databases.map((database) => (
                <CommandItem
                  key={database.id}
                  value={`${database.id} - ${database.name}`}
                  onSelect={() => {
                    onChange(database.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <Avatar
                      id={database.id}
                      name={database.name}
                      avatar={database.avatar}
                      className="size-4"
                    />
                    <p>{database.name}</p>
                    <Check
                      className={cn(
                        'ml-auto size-4',
                        id === database.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
