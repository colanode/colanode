import { UserNode } from '@colanode/core';
import { X } from 'lucide-react';
import React from 'react';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { Badge } from '@/renderer/components/ui/badge';
import { Button } from '@/renderer/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface NodeCollaboratorSearchProps {
  excluded: string[];
  value: UserNode[];
  onChange: (value: UserNode[]) => void;
}

export const NodeCollaboratorSearch = ({
  excluded,
  value,
  onChange,
}: NodeCollaboratorSearchProps) => {
  const workspace = useWorkspace();

  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const { data } = useQuery({
    type: 'user_search',
    searchQuery: query,
    exclude: excluded,
    userId: workspace.userId,
  });

  const users = data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start p-2"
        >
          {value.map((user) => (
            <Badge key={user.id} variant="outline">
              {user.attributes.name}
              <span
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(value.filter((v) => v.id !== user.id));
                }}
              >
                <X className="size-3 text-muted-foreground hover:text-foreground" />
              </span>
            </Badge>
          ))}
          {value.length === 0 && (
            <span className="text-xs text-muted-foreground">
              Add collaborators
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <Command className="min-h-min" shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search collaborators..."
            className="h-9"
          />
          <CommandEmpty>No collaborator found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min max-h-96">
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    onChange([...value, user]);
                    setQuery('');
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <Avatar
                      id={user.id}
                      name={user.attributes.name}
                      avatar={user.attributes.avatar}
                      className="h-7 w-7"
                    />
                    <div className="flex flex-grow flex-col">
                      <p className="text-sm">{user.attributes.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.attributes.email}
                      </p>
                    </div>
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
