import { extractNodeRole } from '@colanode/core';
import { BoardViewCollectionCard } from '@colanode/ui/components/databases/boards/board-view-collection-card';
import { BoardViewRecordCreateCard } from '@colanode/ui/components/databases/boards/board-view-record-create-card';
import { MetaTypePageCreateButton } from '@colanode/ui/components/pages/meta-type-page-create-button';
import { PageFieldsProvider } from '@colanode/ui/components/pages/page-fields-provider';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useBoardView } from '@colanode/ui/contexts/board-view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useCollectionQuery } from '@colanode/ui/hooks/use-collection-query';

export const BoardViewColumnRecords = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const boardView = useBoardView();

  const filters = [...view.filters, boardView.filter];
  const { data } = useCollectionQuery(filters, view.sorts);
  const rows = data;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {rows.map((row) => {
        const role =
          extractNodeRole(row.source, workspace.userId) ?? database.role;

        if (row.nodeType === 'page') {
          return (
            <PageFieldsProvider key={row.id} page={row.source} role={role}>
              <BoardViewCollectionCard row={row} />
            </PageFieldsProvider>
          );
        }

        return (
          <RecordProvider key={row.id} record={row.source} role={role}>
            <BoardViewCollectionCard row={row} />
          </RecordProvider>
        );
      })}
      {database.canCreateRecord && (
        <BoardViewRecordCreateCard filters={filters} />
      )}
      <MetaTypePageCreateButton
        label="Add page"
        className="animate-fade-in flex min-h-12 cursor-pointer flex-row items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-accent"
      />
    </div>
  );
};
