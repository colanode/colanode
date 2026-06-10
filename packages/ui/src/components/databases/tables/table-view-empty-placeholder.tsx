import { useDatabase } from '@colanode/ui/contexts/database';

export const TableViewEmptyPlaceholder = () => {
  const database = useDatabase();
  const isMetaType = (database.purpose ?? 'records') === 'meta_type';

  return (
    <div className="flex w-full flex-col items-center justify-center border-b p-10 text-sm text-muted-foreground">
      <p>{isMetaType ? 'No pages' : 'No records'}</p>
    </div>
  );
};
