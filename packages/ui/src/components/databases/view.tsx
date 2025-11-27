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
import {
  generateFieldValuesFromFilters,
  getDefaultFieldWidth,
  getDefaultNameWidth,
  getDefaultViewFieldDisplay,
} from '@colanode/ui/lib/databases';

interface ViewProps {
  view: LocalDatabaseViewNode;
}

export const View = ({ view }: ViewProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const navigate = useNavigate();

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

            if (fieldId !== SpecialId.Name) {
              const field = database.fields.find((f) => f.id === fieldId);
              if (!field) {
                return;
              }
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
        initFieldSort: async (fieldId: string, direction: SortDirection) => {
          if (!database.canEdit) {
            return;
          }

          const existingSort = view.sorts?.[fieldId];
          if (existingSort && existingSort.direction === direction) {
            return;
          }

          workspace.collections.nodes.update(view.id, (draft) => {
            if (draft.type !== 'database_view') return;

            const existingSort = draft.sorts?.[fieldId];
            if (existingSort && existingSort.direction === direction) {
              return;
            }

            if (fieldId !== SpecialId.Name) {
              const field = database.fields.find((f) => f.id === fieldId);
              if (!field) {
                return;
              }
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
          const viewFilters = Object.values(view.filters ?? {}) ?? [];
          const extraFilters = filters ?? [];

          const allFilters = [...viewFilters, ...extraFilters];
          const fields = generateFieldValuesFromFilters(
            database.fields,
            allFilters,
            workspace.userId
          );

          const recordId = generateId(IdType.Record);
          const record: LocalRecordNode = {
            id: recordId,
            type: 'record',
            parentId: database.id,
            rootId: database.rootId,
            databaseId: database.id,
            name: '',
            fields,
            createdAt: new Date().toISOString(),
            createdBy: workspace.userId,
            updatedAt: null,
            updatedBy: null,
            localRevision: '0',
            serverRevision: '0',
          };

          const nodes = workspace.collections.nodes;
          nodes.insert(record);

          navigate({
            from: '/workspace/$userId/$nodeId',
            to: 'modal/$modalNodeId',
            params: { modalNodeId: record.id },
          });
        },
      }}
    >
      <div className="w-full h-full group/database">
        {match(view.layout)
          .with('table', () => <TableView />)
          .with('board', () => <BoardView />)
          .with('calendar', () => <CalendarView />)
          .exhaustive()}
      </div>
    </DatabaseViewContext.Provider>
  );
};
