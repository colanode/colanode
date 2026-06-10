import { useMemo } from 'react';

import {
  CollaboratorFieldAttributes,
  FieldAttributes,
  MultiSelectFieldAttributes,
  SelectFieldAttributes,
} from '@colanode/core';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useCollectionQuery } from '@colanode/ui/hooks/use-collection-query';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { filterCollectionRows } from '@colanode/ui/lib/collection-view-query';

type FieldValueCount = {
  value: string;
  count: number;
};

type FieldValueCounts = {
  values: FieldValueCount[];
  noValueCount: number;
};

const emptyCounts: FieldValueCounts = { values: [], noValueCount: 0 };

const useMetaTypeSelectFieldValueCounts = (
  field: SelectFieldAttributes | MultiSelectFieldAttributes,
  enabled: boolean
): FieldValueCounts | null => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const { data } = useCollectionQuery(view.filters, view.sorts);

  return useMemo(() => {
    if (!enabled) {
      return null;
    }

    const values = Object.values(field.options ?? {}).map((option) => ({
      value: option.id,
      count: filterCollectionRows(
        data,
        {
          id: option.id,
          type: 'field',
          fieldId: field.id,
          operator: 'is_in',
          value: [option.id],
        },
        database.fields,
        workspace.userId
      ).length,
    }));

    const noValueCount = filterCollectionRows(
      data,
      {
        id: 'no-value',
        type: 'field',
        fieldId: field.id,
        operator: 'is_empty',
      },
      database.fields,
      workspace.userId
    ).length;

    return { values, noValueCount };
  }, [data, database.fields, enabled, field, workspace.userId]);
};

const useMetaTypeCollaboratorFieldValueCounts = (
  field: CollaboratorFieldAttributes,
  enabled: boolean
): FieldValueCounts | null => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const { data } = useCollectionQuery(view.filters, view.sorts);

  return useMemo(() => {
    if (!enabled) {
      return null;
    }

    const counts = new Map<string, number>();
    let noValueCount = 0;

    for (const row of data) {
      const fieldValue = row.fields[field.id];
      if (
        !fieldValue ||
        fieldValue.type !== 'string_array' ||
        fieldValue.value.length === 0
      ) {
        noValueCount += 1;
        continue;
      }

      for (const collaboratorId of fieldValue.value) {
        counts.set(collaboratorId, (counts.get(collaboratorId) ?? 0) + 1);
      }
    }

    const values = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }

        return left.value.localeCompare(right.value);
      });

    return { values, noValueCount };
  }, [data, enabled, field.id]);
};

export const useFieldValueCounts = (
  field: FieldAttributes
): FieldValueCounts & { isPending: boolean } => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const isMetaType = (database.purpose ?? 'records') === 'meta_type';

  const recordQuery = useLiveQuery(
    {
      type: 'record.field.value.count',
      databaseId: database.id,
      filters: view.filters,
      fieldId: field.id,
      userId: workspace.userId,
    },
    { enabled: !isMetaType }
  );

  const metaSelectCounts = useMetaTypeSelectFieldValueCounts(
    field as SelectFieldAttributes | MultiSelectFieldAttributes,
    isMetaType &&
      (field.type === 'select' || field.type === 'multi_select')
  );

  const metaCollaboratorCounts = useMetaTypeCollaboratorFieldValueCounts(
    field as CollaboratorFieldAttributes,
    isMetaType && field.type === 'collaborator'
  );

  if (isMetaType) {
    if (field.type === 'collaborator') {
      return {
        ...(metaCollaboratorCounts ?? emptyCounts),
        isPending: false,
      };
    }

    if (field.type === 'select' || field.type === 'multi_select') {
      return {
        ...(metaSelectCounts ?? emptyCounts),
        isPending: false,
      };
    }

    return { ...emptyCounts, isPending: false };
  }

  return {
    values: recordQuery.data?.values ?? [],
    noValueCount: recordQuery.data?.noValueCount ?? 0,
    isPending: recordQuery.isPending,
  };
};
