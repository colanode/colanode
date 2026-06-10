import { useMemo } from 'react';

import { LocalPageNode } from '@colanode/client/types';
import {
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
} from '@colanode/core';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import {
  CollectionRow,
  pageToCollectionRow,
  recordToCollectionRow,
} from '@colanode/ui/lib/collection-row';
import { applyCollectionViewQuery } from '@colanode/ui/lib/collection-view-query';
import { useRecordsQuery } from '@colanode/ui/hooks/use-records-query';

export const useCollectionQuery = (
  filters: DatabaseViewFilterAttributes[],
  sorts: DatabaseViewSortAttributes[],
  count?: number
) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const isMetaType = (database.purpose ?? 'records') === 'meta_type';

  const recordsQuery = useRecordsQuery(filters, sorts, count, {
    enabled: !isMetaType,
  });

  const pagesQuery = useLiveQuery(
    {
      type: 'page.byMetaType',
      userId: workspace.userId,
      metaTypeId: database.id,
    },
    {
      enabled: isMetaType,
    }
  );

  const data: CollectionRow[] = useMemo(() => {
    if (isMetaType) {
      const rows = (pagesQuery.data ?? []).map((page) =>
        pageToCollectionRow(page as LocalPageNode)
      );

      return applyCollectionViewQuery(
        rows,
        filters,
        sorts,
        database.fields,
        workspace.userId
      );
    }

    return recordsQuery.data.map(recordToCollectionRow);
  }, [
    isMetaType,
    pagesQuery.data,
    recordsQuery.data,
    filters,
    sorts,
    database.fields,
    workspace.userId,
  ]);

  if (isMetaType) {
    return {
      data,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: () => undefined,
    };
  }

  return {
    data,
    hasNextPage: recordsQuery.hasNextPage,
    isFetchingNextPage: recordsQuery.isFetchingNextPage,
    fetchNextPage: recordsQuery.fetchNextPage,
  };
};
