import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { match } from 'ts-pattern';

import {
  LocalDatabaseViewNode,
  LocalRecordNode,
  ViewField,
} from '@colanode/client/types';
import {
  compareString,
  SortDirection,
  DatabaseViewFieldFilterAttributes,
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
  SpecialId,
  generateId,
  IdType,
} from '@colanode/core';
import { BoardView } from '@colanode/ui/components/databases/boards/board-view';
import { CalendarView } from '@colanode/ui/components/databases/calendars/calendar-view';
import { TableView } from '@colanode/ui/components/databases/tables/table-view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { DatabaseViewContext } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database as appDatabase } from '@colanode/ui/data';
import {
  generateFieldValuesFromFilters,
  generateViewFieldIndex,
  getDefaultFieldWidth,
  getDefaultNameWidth,
  getDefaultViewFieldDisplay,
  getFieldFilterOperators,
} from '@colanode/ui/lib/databases';

interface ViewProps {
  view: LocalDatabaseViewNode;
}

export const View = ({ view }: ViewProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const navigate = useNavigate({ from: '/workspace/$userId' });

  const fields: ViewField[] = database.fields
    .map((field) => {
      const viewField = view.attributes.fields?.[field.id];

      return {
        field,
        display:
          viewField?.display ??
          getDefaultViewFieldDisplay(view.attributes.layout),
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
        name: view.attributes.name,
        avatar: view.attributes.avatar,
        layout: view.attributes.layout,
        fields,
        filters: Object.values(view.attributes.filters ?? {}),
        sorts: Object.values(view.attributes.sorts ?? {}),
        groupBy: view.attributes.groupBy,
        nameWidth: view.attributes.nameWidth ?? getDefaultNameWidth(),
        isSearchBarOpened: isSearchBarOpened || openedFieldFilters.length > 0,
        isSortsOpened,
        rename: async (name: string) => {
          if (!database.canEdit) return;

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            draft.attributes.name = name;
          });
        },
        updateAvatar: async (avatar: string) => {
          if (!database.canEdit) return;

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            draft.attributes.avatar = avatar;
          });
        },
        setFieldDisplay: async (id: string, display: boolean) => {
          if (!database.canEdit) return;

          const viewField = view.attributes.fields?.[id];
          if (viewField && viewField.display === display) return;

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            draft.attributes.fields = draft.attributes.fields ?? {};
            if (!draft.attributes.fields[id]) {
              draft.attributes.fields[id] = {
                id: id,
                display: display,
              };
            } else {
              draft.attributes.fields[id].display = display;
            }
          });
        },
        resizeField: async (id: string, width: number) => {
          if (!database.canEdit) {
            return;
          }

          const viewField = view.attributes.fields?.[id];
          if (viewField && viewField.width === width) {
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            draft.attributes.fields = draft.attributes.fields ?? {};
            if (!draft.attributes.fields[id]) {
              draft.attributes.fields[id] = {
                id: id,
                width: width,
              };
            } else {
              draft.attributes.fields[id].width = width;
            }
          });
        },
        resizeName: async (width: number) => {
          if (!database.canEdit) {
            return;
          }

          if (view.attributes.nameWidth === width) {
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            draft.attributes.nameWidth = width;
          });
        },
        setGroupBy: async (fieldId: string | null) => {
          if (!database.canEdit) {
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            draft.attributes.groupBy = fieldId;
          });
        },
        moveField: async (id: string, after: string) => {
          if (!database.canEdit) {
            return;
          }

          const newIndex = generateViewFieldIndex(
            database.fields,
            Object.values(view.attributes.fields ?? {}),
            id,
            after
          );

          if (newIndex === null) {
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            draft.attributes.fields = draft.attributes.fields ?? {};
            if (!draft.attributes.fields[id]) {
              draft.attributes.fields[id] = {
                id: id,
                index: newIndex,
              };
            } else {
              draft.attributes.fields[id].index = newIndex;
            }
          });
        },
        isFieldFilterOpened: (fieldId: string) =>
          openedFieldFilters.includes(fieldId),
        initFieldFilter: async (fieldId: string) => {
          if (!database.canEdit) {
            return;
          }

          if (view.attributes.filters?.[fieldId]) {
            setOpenedFieldFilters((prev) => [...prev, fieldId]);
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          const filterId = generateId(IdType.ViewFilter);
          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            draft.attributes.filters = draft.attributes.filters ?? {};
            if (fieldId === SpecialId.Name) {
              const operators = getFieldFilterOperators('text');
              const filter: DatabaseViewFieldFilterAttributes = {
                type: 'field',
                id: filterId,
                fieldId,
                operator: operators[0]?.value ?? 'contains',
              };

              draft.attributes.filters[filterId] = filter;
            } else {
              const field = database.fields.find((f) => f.id === fieldId);
              if (!field) {
                return;
              }

              const operators = getFieldFilterOperators(field.type);
              const filter: DatabaseViewFieldFilterAttributes = {
                type: 'field',
                id: filterId,
                fieldId,
                operator: operators[0]?.value ?? '',
              };

              draft.attributes.filters[filterId] = filter;
            }
          });

          setOpenedFieldFilters((prev) => [...prev, filterId]);
        },
        updateFilter: async (
          id: string,
          filter: DatabaseViewFilterAttributes
        ) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.attributes.filters?.[id]) {
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            const filters = draft.attributes.filters ?? {};
            filters[id] = filter;
            draft.attributes.filters = filters;
          });

          setIsSearchBarOpened(true);
        },
        removeFilter: async (id: string) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.attributes.filters?.[id]) {
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            if (!draft.attributes) {
              return;
            }

            if (!draft.attributes.filters?.[id]) {
              return;
            }

            delete draft.attributes.filters[id];
          });

          setIsSearchBarOpened(true);
        },
        initFieldSort: async (fieldId: string, direction: SortDirection) => {
          if (!database.canEdit) {
            return;
          }

          const existingSort = view.attributes.sorts?.[fieldId];
          if (existingSort && existingSort.direction === direction) {
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }

            draft.attributes.sorts = draft.attributes.sorts ?? {};

            if (fieldId === SpecialId.Name) {
              const sort: DatabaseViewSortAttributes = {
                id: fieldId,
                fieldId,
                direction,
              };
              draft.attributes.sorts[fieldId] = sort;
            } else {
              const field = database.fields.find((f) => f.id === fieldId);
              if (!field) {
                return;
              }
              const sort: DatabaseViewSortAttributes = {
                id: fieldId,
                fieldId,
                direction,
              };
              draft.attributes.sorts[fieldId] = sort;
            }
          });

          setIsSearchBarOpened(true);
          setIsSortsOpened(true);
        },
        updateSort: async (id: string, sort: DatabaseViewSortAttributes) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.attributes.sorts?.[id]) {
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }
            draft.attributes.sorts = draft.attributes.sorts ?? {};
            draft.attributes.sorts[id] = sort;
          });

          setIsSearchBarOpened(true);
          setIsSortsOpened(true);
        },
        removeSort: async (id: string) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.attributes.sorts?.[id]) {
            return;
          }

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(view.id)) {
            return;
          }

          nodes.update(view.id, (draft) => {
            if (draft.attributes.type !== 'database_view') {
              return;
            }
            draft.attributes.sorts = draft.attributes.sorts ?? {};
            delete draft.attributes.sorts[id];
          });

          setIsSearchBarOpened(true);
          setIsSortsOpened(true);
        },
        openSearchBar: () => {
          setIsSearchBarOpened(true);
        },
        closeSearchBar: () => {
          setIsSearchBarOpened(false);
        },
        openSorts: () => {
          setIsSortsOpened(true);
        },
        closeSorts: () => {
          setIsSortsOpened(false);
        },
        openFieldFilter: (fieldId: string) => {
          setOpenedFieldFilters((prev) => [...prev, fieldId]);
        },
        closeFieldFilter: (fieldId: string) => {
          setOpenedFieldFilters((prev) => prev.filter((id) => id !== fieldId));
        },
        createRecord: async (filters?: DatabaseViewFilterAttributes[]) => {
          const viewFilters =
            Object.values(view.attributes.filters ?? {}) ?? [];
          const extraFilters = filters ?? [];

          const allFilters = [...viewFilters, ...extraFilters];
          const fields = generateFieldValuesFromFilters(
            database.fields,
            allFilters,
            workspace.userId
          );

          const nodes = appDatabase.workspace(workspace.userId).nodes;
          const record: LocalRecordNode = {
            id: generateId(IdType.Record),
            type: 'record',
            attributes: {
              type: 'record',
              parentId: database.id,
              databaseId: database.id,
              name: '',
              fields: fields,
            },
            parentId: database.id,
            rootId: database.id,
            createdAt: new Date().toISOString(),
            createdBy: workspace.userId,
            updatedAt: null,
            updatedBy: null,
            localRevision: '0',
            serverRevision: '0',
          };
          nodes.insert(record);

          navigate({
            to: '$nodeId',
            params: { nodeId: record.id },
          });
        },
      }}
    >
      {match(view.attributes.layout)
        .with('table', () => <TableView />)
        .with('board', () => <BoardView />)
        .with('calendar', () => <CalendarView />)
        .exhaustive()}
    </DatabaseViewContext.Provider>
  );
};
