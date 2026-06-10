import { InView } from 'react-intersection-observer';

import { TableViewEmptyPlaceholder } from '@colanode/ui/components/databases/tables/table-view-empty-placeholder';
import { TableViewRow } from '@colanode/ui/components/databases/tables/table-view-row';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useCollectionQuery } from '@colanode/ui/hooks/use-collection-query';

export const TableViewBody = () => {
  const view = useDatabaseView();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCollectionQuery(view.filters, view.sorts);

  const rows = data;

  return (
    <div className="border-t">
      {rows.length === 0 && <TableViewEmptyPlaceholder />}
      {rows.map((row, index) => (
        <TableViewRow key={row.id} index={index} row={row} />
      ))}
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
      ></InView>
    </div>
  );
};
