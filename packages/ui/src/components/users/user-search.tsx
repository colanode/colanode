import { useState } from 'react';

import { User } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@colanode/ui/components/ui/command';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface UserSearchProps {
  exclude?: string[];
  onSelect: (user: User) => void;
}

export const UserSearch = ({ exclude, onSelect }: UserSearchProps) => {
  const workspace = useWorkspace();

  const [query, setQuery] = useState('');
  const userSearchQuery = useLiveQuery({
    type: 'user.search',
    searchQuery: query,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
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
        <CommandGroup className="h-min">
          {userSearchQuery.data?.map((user) => (
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
                  name={user.name}
                  avatar={user.avatar}
                  className="h-7 w-7"
                />
                <div className="flex flex-grow flex-col">
                  <p className="text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
