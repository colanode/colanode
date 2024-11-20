import React from 'react';
import { match } from 'ts-pattern';
import {
  SortDirection,
  ViewAttributes,
  ViewFieldFilterAttributes,
  ViewFilterAttributes,
  ViewSortAttributes,
} from '@colanode/core';
import { TableView } from '@/renderer/components/databases/tables/table-view';
import { BoardView } from '@/renderer/components/databases/boards/board-view';
import { CalendarView } from '@/renderer/components/databases/calendars/calendar-view';
import { ViewContext } from '@/renderer/contexts/view';
import { useDatabase } from '@/renderer/contexts/database';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { compareString } from '@/shared/lib/utils';
import {
  generateFieldValuesFromFilters,
  generateViewFieldIndex,
  getDefaultFieldWidth,
  getDefaultNameWidth,
  getFieldFilterOperators,
} from '@/shared/lib/databases';
import { ViewField } from '@/shared/types/databases';
import { useMutation } from '@/renderer/hooks/use-mutation';

interface ViewProps {
  view: ViewAttributes;
}

export const View = ({ view }: ViewProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate } = useMutation();

  const fields: ViewField[] = React.useMemo(() => {
    return database.fields
      .map((field) => {
        const viewField = view.fields[field.id];

        return {
          field,
          display: viewField?.display ?? true,
          index: viewField?.index ?? field.index,
          width: viewField?.width ?? getDefaultFieldWidth(field.type),
        };
      })
      .filter((field) => field.display)
      .sort((a, b) => compareString(a.index, b.index));
  }, [database.fields, view.fields]);

  const [isSearchBarOpened, setIsSearchBarOpened] = React.useState(false);
  const [isSortsOpened, setIsSortsOpened] = React.useState(false);
  const [openedFieldFilters, setOpenedFieldFilters] = React.useState<string[]>(
    []
  );

  return (
    <ViewContext.Provider
      value={{
        id: view.id,
        name: view.name,
        avatar: view.avatar,
        fields,
        filters: Object.values(view.filters),
        sorts: Object.values(view.sorts),
        groupBy: view.groupBy,
        nameWidth: view.nameWidth ?? getDefaultNameWidth(),
        isSearchBarOpened,
        isSortsOpened,
        setFieldDisplay: (id: string, display: boolean) => {
          if (!database.canEdit) {
            return;
          }

          const viewField = view.fields[id];
          if (viewField && viewField.display === display) {
            return;
          }

          const viewCopy = { ...view };
          if (!viewCopy.fields[id]) {
            viewCopy.fields[id] = {
              id: id,
              display: display,
            };
          } else {
            viewCopy.fields[id].display = display;
          }

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
          });
        },
        resizeField: (id: string, width: number) => {
          if (!database.canEdit) {
            return;
          }

          const viewField = view.fields[id];
          if (viewField && viewField.width === width) {
            return;
          }

          const viewCopy = { ...view };
          if (!viewCopy.fields[id]) {
            viewCopy.fields[id] = {
              id: id,
              width: width,
            };
          } else {
            viewCopy.fields[id].width = width;
          }

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
          });
        },
        resizeName: (width: number) => {
          if (!database.canEdit) {
            return;
          }

          if (view.nameWidth === width) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.nameWidth = width;

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
          });
        },
        moveField: (id: string, after: string) => {
          if (!database.canEdit) {
            return;
          }

          const newIndex = generateViewFieldIndex(
            database.fields,
            Object.values(view.fields),
            id,
            after
          );
          if (newIndex === null) {
            return;
          }

          const viewCopy = { ...view };
          if (!viewCopy.fields[id]) {
            viewCopy.fields[id] = {
              id: id,
              index: newIndex,
            };
          } else {
            viewCopy.fields[id].index = newIndex;
          }

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
          });
        },
        isFieldFilterOpened: (fieldId: string) =>
          openedFieldFilters.includes(fieldId),
        initFieldFilter: (fieldId: string) => {
          if (!database.canEdit) {
            return;
          }

          if (view.filters[fieldId]) {
            setOpenedFieldFilters((prev) => [...prev, fieldId]);
            return;
          }

          const field = database.fields.find((f) => f.id === fieldId);
          if (!field) {
            return;
          }

          const operators = getFieldFilterOperators(field.type);
          const filter: ViewFieldFilterAttributes = {
            type: 'field',
            id: fieldId,
            fieldId,
            operator: operators[0].value,
            value: null,
          };

          const viewCopy = { ...view };
          viewCopy.filters[fieldId] = filter;

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
            onSuccess() {
              setOpenedFieldFilters((prev) => [...prev, fieldId]);
              setIsSearchBarOpened(true);
            },
          });
        },
        updateFilter: (id: string, filter: ViewFilterAttributes) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.filters[id]) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.filters[id] = filter;

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
            },
          });
        },
        removeFilter: (id: string) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.filters[id]) {
            return;
          }

          const viewCopy = { ...view };
          delete viewCopy.filters[id];

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
            },
          });
        },
        initFieldSort: (fieldId: string, direction: SortDirection) => {
          if (!database.canEdit) {
            return;
          }

          const existingSort = view.sorts[fieldId];
          if (existingSort && existingSort.direction === direction) {
            return;
          }

          const field = database.fields.find((f) => f.id === fieldId);
          if (!field) {
            return;
          }

          const sort: ViewSortAttributes = {
            id: fieldId,
            fieldId,
            direction,
          };

          const viewCopy = { ...view };
          viewCopy.sorts[fieldId] = sort;

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
              setIsSortsOpened(true);
            },
          });
        },
        updateSort: (id: string, sort: ViewSortAttributes) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.sorts[id]) {
            return;
          }

          const viewCopy = { ...view };
          viewCopy.sorts[id] = sort;

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
              setIsSortsOpened(true);
            },
          });
        },
        removeSort: (id: string) => {
          if (!database.canEdit) {
            return;
          }

          if (!view.sorts[id]) {
            return;
          }

          const viewCopy = { ...view };
          delete viewCopy.sorts[id];

          mutate({
            input: {
              type: 'view_update',
              userId: workspace.userId,
              databaseId: database.id,
              view: viewCopy,
            },
            onSuccess() {
              setIsSearchBarOpened(true);
            },
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
        createRecord: (filters?: ViewFilterAttributes[]) => {
          const viewFilters = Object.values(view.filters) ?? [];
          const extraFilters = filters ?? [];

          const allFilters = [...viewFilters, ...extraFilters];
          const fields = generateFieldValuesFromFilters(
            database.fields,
            allFilters,
            workspace.userId
          );

          mutate({
            input: {
              type: 'record_create',
              databaseId: database.id,
              userId: workspace.userId,
              fields,
            },
            onSuccess: (output) => {
              workspace.openInModal(output.id);
            },
          });
        },
      }}
    >
      {match(view.type)
        .with('table', () => <TableView />)
        .with('board', () => <BoardView />)
        .with('calendar', () => <CalendarView />)
        .exhaustive()}
    </ViewContext.Provider>
  );
};
