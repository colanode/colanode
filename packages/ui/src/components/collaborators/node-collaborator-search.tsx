import { X } from 'lucide-react';
import { useState } from 'react';

import { User } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Badge } from '@colanode/ui/components/ui/badge';
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
import { useQuery } from '@colanode/ui/hooks/use-query';

interface NodeCollaboratorSearchProps {
  excluded: string[];
  value: User[];
  onChange: (value: User[]) => void;
}

export const NodeCollaboratorSearch = ({
  excluded,
  value,
  onChange,
}: NodeCollaboratorSearchProps) => {
  const workspace = useWorkspace();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const userSearchQuery = useQuery({
    type: 'user.search',
    searchQuery: query,
    exclude: excluded,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const users = userSearchQuery.data ?? [];

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
              {user.name}
              <span
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
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
            <CommandGroup className="h-min">
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
                      name={user.name}
                      avatar={user.avatar}
                      className="h-7 w-7"
                    />
                    <div className="flex flex-grow flex-col">
                      <p className="text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
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
