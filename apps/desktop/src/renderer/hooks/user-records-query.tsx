import { ViewFilterAttributes, ViewSortAttributes } from '@colanode/core';
import React from 'react';

import { useDatabase } from '@/renderer/contexts/database';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQueries } from '@/renderer/hooks/use-queries';
import { RecordListQueryInput } from '@/shared/queries/records/record-list';

const RECORDS_PER_PAGE = 50;

export const useRecordsQuery = (
  filters: ViewFilterAttributes[],
  sorts: ViewSortAttributes[],
  count?: number
) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const [lastPage, setLastPage] = React.useState<number>(1);

  const inputs: RecordListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'record_list',
    databaseId: database.id,
    filters: filters,
    sorts: sorts,
    page: i + 1,
    count: count ?? RECORDS_PER_PAGE,
    userId: workspace.userId,
  }));

  const result = useQueries(inputs);
  const records = result.flatMap((data) => data.data ?? []);
  const isPending = result.some((data) => data.isPending);
  const hasMore =
    !isPending && records.length === lastPage * (count ?? RECORDS_PER_PAGE);

  const loadMore = React.useCallback(() => {
    if (hasMore && !isPending) {
      setLastPage(lastPage + 1);
    }
  }, [hasMore, isPending, lastPage]);

  return {
    records,
    isPending,
    hasMore,
    loadMore,
  };
};
