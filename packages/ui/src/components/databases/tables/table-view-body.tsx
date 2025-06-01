import { InView } from 'react-intersection-observer';

import { TableViewEmptyPlaceholder } from '@colanode/ui/components/databases/tables/table-view-empty-placeholder';
import { TableViewRow } from '@colanode/ui/components/databases/tables/table-view-row';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useRecordsQuery } from '@colanode/ui/hooks/use-records-query';

export const TableViewBody = () => {
  const view = useDatabaseView();
  const { records, hasMore, loadMore, isPending } = useRecordsQuery(
    view.filters,
    view.sorts
  );

  return (
    <div className="border-t">
      {records.length === 0 && <TableViewEmptyPlaceholder />}
      {records.map((record, index) => (
        <TableViewRow key={record.id} index={index} record={record} />
      ))}
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (inView && hasMore && !isPending) {
            loadMore();
          }
        }}
      ></InView>
    </div>
  );
};
