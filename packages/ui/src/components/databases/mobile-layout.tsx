import type { LocalDatabaseViewNode } from '@colanode/client/types';
import { ViewFilterButton } from '@colanode/ui/components/databases/search/view-filter-button';
import { ViewSearchBar } from '@colanode/ui/components/databases/search/view-search-bar';
import { ViewSortButton } from '@colanode/ui/components/databases/search/view-sort-button';
import { TableViewBody } from '@colanode/ui/components/databases/tables/table-view-body';
import { TableViewRecordCreateRow } from '@colanode/ui/components/databases/tables/table-view-record-create-row';
import { TableViewSettings } from '@colanode/ui/components/databases/tables/table-view-settings';
import { ViewFullscreenButton } from '@colanode/ui/components/databases/view-fullscreen-button';
import { ViewTabs } from '@colanode/ui/components/databases/view-tabs';
import { useDatabase } from '@colanode/ui/contexts/database';
import { DatabaseViewContext } from '@colanode/ui/contexts/database-view';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useDatabaseViews } from '@colanode/ui/contexts/database-views';
import { useDatabaseViewValue } from '@colanode/ui/hooks/use-database-view-value';

export const MobileLayout = ({
  view,
  inline,
}: {
  view: LocalDatabaseViewNode;
  inline: boolean;
}) => {
  const contextValue = useDatabaseViewValue(view);

  return (
    <DatabaseViewContext.Provider value={contextValue}>
      {view.layout === 'table' ? (
        <MobileTableView inline={inline} />
      ) : (
        <MobileUnsupportedView inline={inline} />
      )}
    </DatabaseViewContext.Provider>
  );
};

const MobileTableView = ({ inline }: { inline: boolean }) => {
  return (
    <div className="w-full h-full group/database">
      <div className="flex flex-row justify-between border-b gap-2">
        <ViewTabs />
        <div className="flex flex-row items-center justify-end gap-1">
          {inline && <ViewFullscreenButton />}
          <TableViewSettings />
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-1">
        <MobileTableViewHeader />
        <TableViewBody />
        <MobileTableViewRecordCreateRow />
      </div>
    </div>
  );
};

const MobileTableViewHeader = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  return (
    <div className="flex flex-row items-center gap-0.5 border-b bg-background">
      <div
        className="flex h-8 items-center justify-center text-xs text-muted-foreground"
        style={{ width: '30px', minWidth: '30px' }}
      >
        #
      </div>
      <div
        className="flex h-8 items-center border-r px-2 text-sm font-medium"
        style={{ width: `${view.nameWidth}px`, minWidth: '240px' }}
      >
        <span className="truncate">{database.nameField?.name ?? 'Name'}</span>
      </div>
      {view.fields.map((field) => (
        <div
          key={`header-${field.field.id}`}
          className="flex h-8 items-center border-r px-2 text-sm font-medium"
          style={{ width: `${field.width}px`, minWidth: '120px' }}
        >
          <span className="truncate">{field.field.name}</span>
        </div>
      ))}
      <div className="w-2" />
    </div>
  );
};

const MobileTableViewRecordCreateRow = () => {
  const database = useDatabase();

  if (!database.canCreateRecord || database.isLocked) {
    return null;
  }

  return <TableViewRecordCreateRow />;
};

const MobileUnsupportedView = ({ inline }: { inline: boolean }) => {
  const view = useDatabaseView();
  const databaseViews = useDatabaseViews();
  const tableView = databaseViews.views.find(
    (candidate) => candidate.layout === 'table'
  );
  const layoutName =
    view.layout === 'board'
      ? 'Board'
      : view.layout === 'calendar'
        ? 'Calendar'
        : 'This';

  return (
    <div className="w-full h-full group/database">
      <div className="flex flex-row justify-between border-b gap-2">
        <ViewTabs />
        <div className="flex flex-row items-center justify-end gap-1">
          {inline && <ViewFullscreenButton />}
          <TableViewSettings />
        </div>
      </div>
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        <div className="max-w-sm space-y-2">
          <p className="text-base font-medium">
            {layoutName} views are not available on mobile yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Open a table view to browse and edit records on mobile.
          </p>
        </div>
        {tableView ? (
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
            onClick={() => databaseViews.onActiveViewChange(tableView.id)}
          >
            Open {tableView.name || 'Table'} view
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Create a table view on desktop or web to use this database on
            mobile.
          </p>
        )}
      </div>
    </div>
  );
};
