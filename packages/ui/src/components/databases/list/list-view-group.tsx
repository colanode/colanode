import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { InView } from 'react-intersection-observer';

import { DatabaseViewFilterAttributes, extractNodeRole } from '@colanode/core';
import { ListViewCollectionRow } from '@colanode/ui/components/databases/list/list-view-collection-row';
import { MetaTypePageCreateButton } from '@colanode/ui/components/pages/meta-type-page-create-button';
import { PageFieldsProvider } from '@colanode/ui/components/pages/page-fields-provider';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useCollectionQuery } from '@colanode/ui/hooks/use-collection-query';

interface ListViewGroupProps {
  header: ReactNode;
  filter: DatabaseViewFilterAttributes;
}

export const ListViewGroup = ({ header, filter }: ListViewGroupProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();

  const [open, setOpen] = useState(true);

  const filters = useMemo(
    () => [...view.filters, filter],
    [view.filters, filter]
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCollectionQuery(filters, view.sorts);
  const rows = data;

  return (
    <div className="flex flex-col">
      <div
        className="flex cursor-pointer flex-row items-center gap-2 py-1"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
        {header}
      </div>
      {open && (
        <>
          <div className="flex flex-col border-t">
            {rows.map((row) => {
              const role =
                extractNodeRole(row.source, workspace.userId) ?? database.role;

              if (row.nodeType === 'page') {
                return (
                  <PageFieldsProvider key={row.id} page={row.source} role={role}>
                    <ListViewCollectionRow row={row} />
                  </PageFieldsProvider>
                );
              }

              return (
                <RecordProvider key={row.id} record={row.source} role={role}>
                  <ListViewCollectionRow row={row} />
                </RecordProvider>
              );
            })}
          </div>
          {database.canCreateRecord && (
            <button
              type="button"
              className="animate-fade-in mt-1 flex h-9 w-full cursor-pointer flex-row items-center gap-1 rounded-md px-2 text-muted-foreground hover:bg-accent"
              onClick={() => view.createRecord([filter])}
            >
              <Plus className="size-4" />
              <span className="text-sm">Add record</span>
            </button>
          )}
          <MetaTypePageCreateButton
            className="animate-fade-in mt-1 flex h-9 w-full cursor-pointer flex-row items-center gap-1 rounded-md px-2 text-muted-foreground hover:bg-accent"
          />
          <InView
            rootMargin="200px"
            onChange={(inView) => {
              if (inView && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
          ></InView>
        </>
      )}
    </div>
  );
};
