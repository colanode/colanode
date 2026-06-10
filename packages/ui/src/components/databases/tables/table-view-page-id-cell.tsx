import { CollectionViewPageId } from '@colanode/ui/components/databases/collection-view-page-id';
import { CollectionRow } from '@colanode/ui/lib/collection-row';

interface TableViewPageIdCellProps {
  row: CollectionRow;
}

export const TableViewPageIdCell = ({ row }: TableViewPageIdCellProps) => {
  return (
    <CollectionViewPageId
      pageId={row.id}
      className="flex h-full w-full items-center px-1 hover:bg-accent"
    />
  );
};
