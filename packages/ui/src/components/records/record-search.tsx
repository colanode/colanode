import { useState } from 'react';

import { LocalRecordNode } from '@colanode/client/types';
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
import { useQuery } from '@colanode/ui/hooks/use-query';

interface RecordSearchProps {
  exclude?: string[];
  onSelect: (record: LocalRecordNode) => void;
  databaseId: string;
}

export const RecordSearch = ({
  exclude,
  onSelect,
  databaseId,
}: RecordSearchProps) => {
  const workspace = useWorkspace();

  const [query, setQuery] = useState('');
  const recordSearchQuery = useQuery({
    type: 'record.search',
    searchQuery: query,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    exclude,
    databaseId,
  });

  return (
    <Command className="min-h-min" shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search records..."
        className="h-9"
      />
      <CommandEmpty>No record found.</CommandEmpty>
      <CommandList>
        <CommandGroup className="h-min">
          {recordSearchQuery.data?.map((record) => (
            <CommandItem
              key={record.id}
              onSelect={() => {
                onSelect(record);
                setQuery('');
              }}
            >
              <div className="flex w-full flex-row items-center gap-2">
                <Avatar
                  id={record.id}
                  name={record.attributes.name}
                  avatar={record.attributes.avatar}
                  className="size-4"
                />
                <p className="text-sm flex-grow">{record.attributes.name}</p>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
