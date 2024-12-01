import { TableViewEmptyPlaceholder } from '@/renderer/components/databases/tables/table-view-empty-placeholder';
import { TableViewLoadMoreRow } from '@/renderer/components/databases/tables/table-view-load-more-row';
import { TableViewRow } from '@/renderer/components/databases/tables/table-view-row';
import { useView } from '@/renderer/contexts/view';
import { useRecordsQuery } from '@/renderer/hooks/user-records-query';

export const TableViewBody = () => {
  const view = useView();
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
      {hasMore && (
        <TableViewLoadMoreRow isPending={isPending} onClick={loadMore} />
      )}
    </div>
  );
};
