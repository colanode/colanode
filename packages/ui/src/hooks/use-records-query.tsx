import { useCallback, useState } from 'react';

import { RecordListQueryInput } from '@colanode/client/queries';
import {
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
} from '@colanode/core';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQueries } from '@colanode/ui/hooks/use-live-queries';

const RECORDS_PER_PAGE = 50;

export const useRecordsQuery = (
  filters: DatabaseViewFilterAttributes[],
  sorts: DatabaseViewSortAttributes[],
  count?: number
) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const [lastPage, setLastPage] = useState<number>(1);

  const inputs: RecordListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'record.list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    databaseId: database.id,
    filters: filters,
    sorts: sorts,
    page: i + 1,
    count: count ?? RECORDS_PER_PAGE,
    userId: workspace.userId,
  }));

  const result = useLiveQueries(inputs);
  const records = result.flatMap((data) => data.data ?? []);
  const isPending = result.some((data) => data.isPending);
  const hasMore =
    !isPending && records.length === lastPage * (count ?? RECORDS_PER_PAGE);

  const loadMore = useCallback(() => {
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
