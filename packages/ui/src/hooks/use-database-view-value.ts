import { useState } from 'react';

import {
  LocalDatabaseViewNode,
  LocalRecordNode,
  ViewField,
} from '@colanode/client/types';
import {
  compareString,
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
  IdType,
  SortDirection,
  SpecialId,
  generateId,
} from '@colanode/core';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useNavigation } from '@colanode/ui/contexts/navigation';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import {
  generateFieldValuesFromFilters,
  getDefaultFieldWidth,
  getDefaultNameWidth,
  getDefaultViewFieldDisplay,
} from '@colanode/ui/lib/databases';

export const useDatabaseViewValue = (view: LocalDatabaseViewNode) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const navigation = useNavigation();

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

  return {
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
      navigation.openNode(record.id, 'record');
    },
  };
};
