import { eq, useLiveQuery } from '@tanstack/react-db';
import { useState } from 'react';

import { LocalDatabaseNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@colanode/ui/components/ui/command';
import {
  ScrollArea,
  ScrollViewport,
  ScrollBar,
} from '@colanode/ui/components/ui/scroll-area';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface RelationTarget {
  id: string;
  name: string;
  avatar?: string | null;
}

interface RelationTargetSearchProps {
  databaseId: string;
  exclude?: string[];
  onSelect: (target: RelationTarget) => void;
}

export const RelationTargetSearch = ({
  databaseId,
  exclude,
  onSelect,
}: RelationTargetSearchProps) => {
  const workspace = useWorkspace();
  const [query, setQuery] = useState('');

  const targetDatabaseQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.id, databaseId)),
    [workspace.userId, databaseId]
  );

  const targetDatabase = targetDatabaseQuery.data[0] as
    | LocalDatabaseNode
    | undefined;
  const isMetaType =
    targetDatabase?.type === 'database' &&
    (targetDatabase.purpose ?? 'records') === 'meta_type';

  const recordSearchQuery = useQuery(
    {
      type: 'record.search',
      searchQuery: query,
      userId: workspace.userId,
      exclude,
      databaseId,
    },
    { enabled: !isMetaType }
  );

  const pageSearchQuery = useQuery(
    {
      type: 'page.byMetaType',
      searchQuery: query,
      userId: workspace.userId,
      exclude,
      metaTypeId: databaseId,
    },
    { enabled: isMetaType }
  );

  const results: RelationTarget[] = isMetaType
    ? (pageSearchQuery.data ?? []).map((page) => ({
        id: page.id,
        name: page.name,
        avatar: page.avatar,
      }))
    : (recordSearchQuery.data ?? []).map((record) => ({
        id: record.id,
        name: record.name,
        avatar: record.avatar,
      }));

  const emptyLabel = isMetaType ? 'No page found.' : 'No record found.';
  const placeholder = isMetaType ? 'Search pages...' : 'Search records...';

  return (
    <Command className="min-h-min" shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={placeholder}
        className="h-9"
      />
      <CommandEmpty>{emptyLabel}</CommandEmpty>
      <ScrollArea className="h-80">
        <ScrollViewport>
          <CommandList className="max-h-none overflow-hidden">
            <CommandGroup className="h-min">
              {results.map((target) => (
                <CommandItem
                  key={target.id}
                  onSelect={() => {
                    onSelect(target);
                    setQuery('');
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <Avatar
                      id={target.id}
                      name={target.name}
                      avatar={target.avatar}
                      className="size-4"
                    />
                    <p className="grow text-sm">{target.name}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </ScrollViewport>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </Command>
  );
};
