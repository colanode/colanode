import { toast } from 'sonner';

import { CollectionRow } from '@colanode/ui/lib/collection-row';

interface TableViewPageIdCellProps {
  row: CollectionRow;
}

export const TableViewPageIdCell = ({ row }: TableViewPageIdCellProps) => {
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(row.id);
      toast.success('Page ID copied');
    } catch {
      toast.error('Failed to copy page ID');
    }
  };

  return (
    <button
      type="button"
      title={row.id}
      onClick={copyId}
      className="flex h-full w-full cursor-pointer items-center truncate px-1 font-mono text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {row.id}
    </button>
  );
};
