import React from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { UserNode } from '@colanode/core';

interface UserSearchProps {
  exclude?: string[];
  onSelect: (user: UserNode) => void;
}

export const UserSearch = ({ exclude, onSelect }: UserSearchProps) => {
  const workspace = useWorkspace();

  const [query, setQuery] = React.useState('');
  const { data } = useQuery({
    type: 'user_search',
    searchQuery: query,
    userId: workspace.userId,
    exclude,
  });

  return (
    <Command className="min-h-min" shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search users..."
        className="h-9"
      />
      <CommandEmpty>No user found.</CommandEmpty>
      <CommandList>
        <CommandGroup className="h-min max-h-96">
          {data?.map((user) => (
            <CommandItem
              key={user.id}
              onSelect={() => {
                onSelect(user);
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
  );
};
