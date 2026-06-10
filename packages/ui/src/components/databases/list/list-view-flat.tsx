import { Plus } from 'lucide-react';
import { InView } from 'react-intersection-observer';

import { extractNodeRole } from '@colanode/core';
import { ListViewCollectionRow } from '@colanode/ui/components/databases/list/list-view-collection-row';
import { MetaTypePageCreateButton } from '@colanode/ui/components/pages/meta-type-page-create-button';
import { PageFieldsProvider } from '@colanode/ui/components/pages/page-fields-provider';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useCollectionQuery } from '@colanode/ui/hooks/use-collection-query';

export const ListViewFlat = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCollectionQuery(view.filters, view.sorts);
  const rows = data;

  return (
    <>
      {rows.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">
          {database.purpose === 'meta_type' ? 'No pages' : 'No records'}
        </p>
      )}
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
          onClick={() => view.createRecord()}
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
  );
};
