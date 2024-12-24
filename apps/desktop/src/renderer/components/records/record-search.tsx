import { RecordEntry } from '@colanode/core';
import React from 'react';

import { Avatar } from '@/renderer/components/avatars/avatar';
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

interface RecordSearchProps {
  exclude?: string[];
  onSelect: (record: RecordEntry) => void;
  databaseId: string;
}

export const RecordSearch = ({
  exclude,
  onSelect,
  databaseId,
}: RecordSearchProps) => {
  const workspace = useWorkspace();

  const [query, setQuery] = React.useState('');
  const { data } = useQuery({
    type: 'record_search',
    searchQuery: query,
    userId: workspace.userId,
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
        <CommandGroup className="h-min max-h-96">
          {data?.map((record) => (
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