import { extractNodeRole } from '@colanode/core';
import { TableViewNameCell } from '@colanode/ui/components/databases/tables/table-view-name-cell';
import { TableViewPageIdCell } from '@colanode/ui/components/databases/tables/table-view-page-id-cell';
import { PageFieldsProvider } from '@colanode/ui/components/pages/page-fields-provider';
import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { CollectionRow } from '@colanode/ui/lib/collection-row';

interface TableViewRowProps {
  index: number;
  row: CollectionRow;
}

export const TableViewRow = ({ index, row }: TableViewRowProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const isMetaType = (database.purpose ?? 'records') === 'meta_type';
  const role =
    extractNodeRole(row.source, workspace.userId) ?? database.role;

  const fieldCells = view.fields.map((field) => (
    <div
      key={`row-${row.id}-${field.field.id}`}
      className="h-8 overflow-hidden border-r p-1"
      style={{ width: `${field.width}px` }}
    >
      <RecordFieldValue field={field.field} />
    </div>
  ));

  const content = (
    <div className="animate-fade-in flex flex-row items-center gap-0.5 border-b">
      <span
        className="flex cursor-pointer items-center justify-center text-sm text-muted-foreground"
        style={{ width: '30px', minWidth: '30px' }}
      >
        {index + 1}
      </span>
      {isMetaType && (
        <div
          className="h-8 overflow-hidden border-r"
          style={{ width: '200px', minWidth: '200px' }}
        >
          <TableViewPageIdCell row={row} />
        </div>
      )}
      <div
        className="h-8 overflow-hidden border-r"
        style={{ width: `${view.nameWidth}px`, minWidth: '300px' }}
      >
        <TableViewNameCell row={row} />
      </div>
      {fieldCells}
      <div className="w-8" />
    </div>
  );

  if (row.nodeType === 'page') {
    return (
      <PageFieldsProvider page={row.source} role={role}>
        {content}
      </PageFieldsProvider>
    );
  }

  return (
    <RecordProvider record={row.source} role={role}>
      {content}
    </RecordProvider>
  );
};
