import { eq, useLiveQuery } from '@tanstack/react-db';
import { InView } from 'react-intersection-observer';
import {
  Fullscreen,
  Lock,
  LockOpen,
  SquareArrowOutUpRight,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  LocalDatabaseNode,
  LocalDatabaseViewNode,
  LocalRecordNode,
  ViewField,
} from '@colanode/client/types';
import {
  compareString,
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
  IdType,
  SpecialId,
  SortDirection,
  extractNodeRole,
  generateId,
} from '@colanode/core';
import { DatabaseNotFound } from '@colanode/ui/components/databases/database-not-found';
import { Database } from '@colanode/ui/components/databases/database';
import { ViewAvatarInput } from '@colanode/ui/components/databases/view-avatar-input';
import { ViewFieldSettings } from '@colanode/ui/components/databases/view-field-settings';
import { ViewRenameInput } from '@colanode/ui/components/databases/view-rename-input';
import { ViewSettingsButton } from '@colanode/ui/components/databases/view-settings-button';
import { ViewTab } from '@colanode/ui/components/databases/view-tab';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@colanode/ui/components/ui/alert-dialog';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { DatabaseViewsContext } from '@colanode/ui/contexts/database-views';
import { DatabaseViewContext } from '@colanode/ui/contexts/database-view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useDatabaseViews } from '@colanode/ui/contexts/database-views';
import { useNode } from '@colanode/ui/contexts/node';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { TableViewEmptyPlaceholder } from '@colanode/ui/components/databases/tables/table-view-empty-placeholder';
import { TableViewRecordCreateRow } from '@colanode/ui/components/databases/tables/table-view-record-create-row';
import { ViewFilterButton } from '@colanode/ui/components/databases/search/view-filter-button';
import { ViewSearchBar } from '@colanode/ui/components/databases/search/view-search-bar';
import { ViewSortButton } from '@colanode/ui/components/databases/search/view-sort-button';
import { NodeProvider } from '@colanode/ui/components/nodes/node-provider';
import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useRecord } from '@colanode/ui/contexts/record';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';
import { useRecordsQuery } from '@colanode/ui/hooks/use-records-query';
import {
  generateFieldValuesFromFilters,
  getDefaultFieldWidth,
  getDefaultNameWidth,
  getDefaultViewFieldDisplay,
} from '@colanode/ui/lib/databases';

import { postNavigateNode } from './bridge';

interface MobileDatabaseRuntimeProps {
  databaseId: string;
  inline?: boolean;
}

interface MobileDatabaseViewsProps {
  inline?: boolean;
}

interface MobileDatabaseViewProps {
  view: LocalDatabaseViewNode;
  inline?: boolean;
}

export const MobileDatabaseRuntime = ({
  databaseId,
  inline = false,
}: MobileDatabaseRuntimeProps) => {
  return (
    <NodeProvider nodeId={databaseId}>
      <MobileDatabaseRuntimeContent inline={inline} />
    </NodeProvider>
  );
};

const MobileDatabaseRuntimeContent = ({
  inline,
}: {
  inline: boolean;
}) => {
  const { node, role } = useNode<LocalDatabaseNode>();

  if (!node || node.type !== 'database') {
    return <DatabaseNotFound />;
  }

  return (
    <Database database={node} role={role}>
      <MobileDatabaseViews inline={inline} />
    </Database>
  );
};

const MobileDatabaseViews = ({
  inline = false,
}: MobileDatabaseViewsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const [activeViewId, setActiveViewId] = useMetadata<string>(
    workspace.userId,
    `${database.id}.activeViewId`
  );

  const viewsQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.type, 'database_view'))
        .where(({ nodes }) => eq(nodes.parentId, database.id)),
    [workspace.userId, database.id]
  );

  const views = (viewsQuery.data ?? [])
    .map((node) => node as LocalDatabaseViewNode)
    .sort((a, b) => compareString(a.index, b.index));

  const activeView = views.find((view) => view.id === activeViewId) ?? views[0];

  if (!activeView) {
    return null;
  }

  return (
    <DatabaseViewsContext.Provider
      value={{
        views,
        activeViewId: activeView.id,
        onActiveViewChange: setActiveViewId,
        inline,
      }}
    >
      <MobileDatabaseView view={activeView} inline={inline} />
    </DatabaseViewsContext.Provider>
  );
};

const MobileDatabaseView = ({
  view,
  inline = false,
}: MobileDatabaseViewProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const fields: ViewField[] = database.fields
    .map((field) => {
      const viewField = view.fields?.[field.id];

      return {
        field,
        display: viewField?.display ?? getDefaultViewFieldDisplay(view.layout),
        index: viewField?.index ?? field.index,
        width: viewField?.width ?? getDefaultFieldWidth(field.type),
      };
    })
    .filter((field) => field.display)
    .sort((a, b) => compareString(a.index, b.index));

  const [isSearchBarOpened, setIsSearchBarOpened] = useState(false);
  const [isSortsOpened, setIsSortsOpened] = useState(false);
  const [openedFieldFilters, setOpenedFieldFilters] = useState<string[]>([]);

  return (
    <DatabaseViewContext.Provider
      value={{
        id: view.id,
        name: view.name,
        avatar: view.avatar,
        layout: view.layout,
        fields,
        filters: Object.values(view.filters ?? {}),
        sorts: Object.values(view.sorts ?? {}),
        groupBy: view.groupBy,
        nameWidth: view.nameWidth ?? getDefaultNameWidth(),
        isSearchBarOpened: isSearchBarOpened || openedFieldFilters.length > 0,
        isSortsOpened,
        isFieldFilterOpened: (fieldId: string) =>
          openedFieldFilters.includes(fieldId),
        initFieldFilter: (fieldId: string) => {
          workspace.collections.nodes.update(view.id, (draft) => {
            if (draft.type !== 'database_view') return;

            const existingFilter = draft.filters?.[fieldId];
            if (existingFilter) {
              setOpenedFieldFilters((prev) =>
                prev.filter((id) => id !== fieldId)
              );
              return;
            }

            if (
              fieldId !== SpecialId.Name &&
              !database.fields.find((field) => field.id === fieldId)
            ) {
              return;
            }

            const filter: DatabaseViewFilterAttributes = {
              id: fieldId,
              fieldId,
              type: 'field',
              operator: 'equals',
              value: '',
            };

            draft.filters = {
              ...draft.filters,
              [fieldId]: filter,
            };

            setOpenedFieldFilters((prev) => [...prev, fieldId]);
          });
        },
        initFieldSort: (fieldId: string, direction: SortDirection) => {
          if (!database.canEdit || database.isLocked) {
            return;
          }

          workspace.collections.nodes.update(view.id, (draft) => {
            if (draft.type !== 'database_view') return;

            const existingSort = draft.sorts?.[fieldId];
            if (existingSort && existingSort.direction === direction) {
              return;
            }

            if (
              fieldId !== SpecialId.Name &&
              !database.fields.find((field) => field.id === fieldId)
            ) {
              return;
            }

            const sort: DatabaseViewSortAttributes = {
              id: fieldId,
              fieldId,
              direction,
            };

            draft.sorts = {
              ...draft.sorts,
              [fieldId]: sort,
            };
          });
        },
        openSearchBar: () => setIsSearchBarOpened(true),
        closeSearchBar: () => setIsSearchBarOpened(false),
        openSorts: () => setIsSortsOpened(true),
        closeSorts: () => setIsSortsOpened(false),
        openFieldFilter: (fieldId: string) => {
          setOpenedFieldFilters((prev) => [...prev, fieldId]);
        },
        closeFieldFilter: (fieldId: string) => {
          setOpenedFieldFilters((prev) => prev.filter((id) => id !== fieldId));
        },
        createRecord: (filters?: DatabaseViewFilterAttributes[]) => {
          if (!database.canCreateRecord || database.isLocked) {
            return;
          }

          const allFilters = [
            ...(Object.values(view.filters ?? {}) ?? []),
            ...(filters ?? []),
          ];

          const recordId = generateId(IdType.Record);
          const record: LocalRecordNode = {
            id: recordId,
            type: 'record',
            parentId: database.id,
            rootId: database.rootId,
            databaseId: database.id,
            name: '',
            fields: generateFieldValuesFromFilters(
              database.fields,
              allFilters,
              workspace.userId
            ),
            createdAt: new Date().toISOString(),
            createdBy: workspace.userId,
            updatedAt: null,
            updatedBy: null,
            localRevision: '0',
            serverRevision: '0',
          };

          workspace.collections.nodes.insert(record);
          postNavigateNode(record.id, 'record');
        },
      }}
    >
      {view.layout === 'table' ? (
        <MobileTableView inline={inline} />
      ) : (
        <MobileUnsupportedView inline={inline} />
      )}
    </DatabaseViewContext.Provider>
  );
};

const MobileInlineFullscreenButton = () => {
  const database = useDatabase();
  const views = useDatabaseViews();

  if (!views.inline) {
    return null;
  }

  return (
    <button
      type="button"
      className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-accent"
      onClick={() => postNavigateNode(database.id, 'database')}
    >
      <Fullscreen className="size-4" />
    </button>
  );
};

const MobileViewTabs = () => {
  const databaseViews = useDatabaseViews();

  return (
    <div className="flex flex-row items-center gap-3 overflow-x-auto pr-2">
      {databaseViews.views.map((view) => (
        <ViewTab
          key={view.id}
          view={view}
          isActive={view.id === databaseViews.activeViewId}
          onClick={() => databaseViews.onActiveViewChange(view.id)}
        />
      ))}
    </div>
  );
};

const MobileViewSettings = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const databaseViews = useDatabaseViews();

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const canDeleteView = databaseViews.views.length > 1;

  const handleDeleteView = () => {
    const nextViewId =
      databaseViews.views.find((candidate) => candidate.id !== view.id)?.id ??
      '';

    workspace.collections.nodes.delete(view.id);
    databaseViews.onActiveViewChange(nextViewId);
    setOpenDelete(false);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <ViewSettingsButton />
        </PopoverTrigger>
        <PopoverContent className="mr-4 flex w-90 flex-col gap-1.5 p-2">
          <div className="flex flex-row items-center gap-2">
            <ViewAvatarInput
              id={view.id}
              name={view.name}
              avatar={view.avatar}
              layout={view.layout}
              readOnly={!database.canEdit || database.isLocked}
            />
            <ViewRenameInput
              id={view.id}
              name={view.name}
              readOnly={!database.canEdit || database.isLocked}
            />
          </div>
          <Separator />
          <ViewFieldSettings />
          {database.canEdit && (
            <>
              <Separator />
              <div className="flex flex-col gap-2 text-sm">
                <p className="my-1 font-semibold">Settings</p>
                <div
                  className="flex cursor-pointer flex-row items-center gap-1 rounded-md p-0.5 hover:bg-accent"
                  onClick={() => {
                    database.toggleLock();
                  }}
                >
                  {database.isLocked ? (
                    <LockOpen className="size-4" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  <span>
                    {database.isLocked ? 'Unlock database' : 'Lock database'}
                  </span>
                </div>
                {canDeleteView && !database.isLocked && (
                  <div
                    className="flex cursor-pointer flex-row items-center gap-1 rounded-md p-0.5 hover:bg-accent"
                    onClick={() => {
                      setOpenDelete(true);
                      setOpen(false);
                    }}
                  >
                    <Trash2 className="size-4" />
                    <span>Delete view</span>
                  </div>
                )}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want delete this view?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This view will no longer be
              accessible and all data in the view will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteView}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const MobileTableView = ({ inline }: { inline: boolean }) => {
  return (
    <div className="w-full h-full group/database">
      <div className="flex flex-row justify-between border-b gap-2">
        <MobileViewTabs />
        <div className="flex flex-row items-center justify-end gap-1">
          {inline && <MobileInlineFullscreenButton />}
          <MobileViewSettings />
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-1">
        <MobileTableViewHeader />
        <MobileTableViewBody />
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
        <MobileViewTabs />
        <div className="flex flex-row items-center justify-end gap-1">
          {inline && <MobileInlineFullscreenButton />}
          <MobileViewSettings />
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

const MobileTableViewBody = () => {
  const view = useDatabaseView();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRecordsQuery(view.filters, view.sorts);
  const records = data ?? [];

  return (
    <div className="border-t">
      {records.length === 0 && <TableViewEmptyPlaceholder />}
      {records.map((record, index) => (
        <MobileTableViewRow key={record.id} index={index} record={record} />
      ))}
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
      />
    </div>
  );
};

const MobileTableViewRow = ({
  index,
  record,
}: {
  index: number;
  record: LocalRecordNode;
}) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const role = extractNodeRole(record, workspace.userId) ?? database.role;

  return (
    <RecordProvider record={record} role={role}>
      <div className="animate-fade-in flex flex-row items-center gap-0.5 border-b">
        <span
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ width: '30px', minWidth: '30px' }}
        >
          {index + 1}
        </span>
        <div
          className="h-8 border-r overflow-hidden"
          style={{ width: `${view.nameWidth}px`, minWidth: '240px' }}
        >
          <MobileTableViewNameCell record={record} />
        </div>
        {view.fields.map((field) => (
          <div
            key={`row-${record.id}-${field.field.id}`}
            className="h-8 border-r p-1 overflow-hidden"
            style={{ width: `${field.width}px`, minWidth: '120px' }}
          >
            <RecordFieldValue field={field.field} readOnly={database.isLocked} />
          </div>
        ))}
        <div className="w-2" />
      </div>
    </RecordProvider>
  );
};

const MobileTableViewRecordCreateRow = () => {
  const database = useDatabase();

  if (!database.canCreateRecord || database.isLocked) {
    return null;
  }

  return <TableViewRecordCreateRow />;
};

const MobileTableViewNameCell = ({ record }: { record: LocalRecordNode }) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const currentRecord = useRecord();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(record.name ?? '');
  const canEditName = currentRecord.canEdit && !database.isLocked;

  useEffect(() => {
    if (!isEditing) {
      setValue(record.name ?? '');
    }
  }, [isEditing, record.name]);

  const save = () => {
    if (!canEditName) {
      setIsEditing(false);
      return;
    }

    if (value !== record.name) {
      workspace.collections.nodes.update(record.id, (draft) => {
        if (draft.type !== 'record') {
          return;
        }

        draft.name = value;
      });
    }

    setIsEditing(false);
  };

  return (
    <div className="group relative flex h-full w-full items-center">
      {isEditing ? (
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              save();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setValue(record.name ?? '');
              setIsEditing(false);
            }
          }}
          className="flex h-full w-full cursor-text flex-row items-center gap-1 p-1 text-sm outline-none"
          autoFocus
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              if (!canEditName) {
                return;
              }

              setIsEditing(true);
            }}
            className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm text-left"
          >
            {record.name ? (
              <span className="truncate">{record.name}</span>
            ) : (
              <span className="text-muted-foreground">Unnamed</span>
            )}
          </button>
          <button
            type="button"
            className="absolute right-2 flex h-6 cursor-pointer flex-row items-center gap-1 rounded-md border p-1 text-sm text-muted-foreground hover:bg-accent"
            onClick={() => postNavigateNode(record.id, 'record')}
          >
            <SquareArrowOutUpRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
};
