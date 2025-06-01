import { LocalRecordNode } from '@colanode/client/types';
import { extractNodeRole } from '@colanode/core';
import { TableViewNameCell } from '@colanode/ui/components/databases/tables/table-view-name-cell';
import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface TableViewRowProps {
  index: number;
  record: LocalRecordNode;
}

export const TableViewRow = ({ index, record }: TableViewRowProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const role = extractNodeRole(record, workspace.userId) ?? database.role;

  return (
    <RecordProvider record={record} role={role}>
      <div className="animate-fade-in flex flex-row items-center gap-0.5 border-b">
        <span
          className="flex cursor-pointer items-center justify-center text-sm text-muted-foreground"
          style={{ width: '30px', minWidth: '30px' }}
        >
          {index + 1}
        </span>
        <div
          className="h-8 border-r overflow-hidden"
          style={{ width: `${view.nameWidth}px`, minWidth: '300px' }}
        >
          <TableViewNameCell record={record} />
        </div>
        {view.fields.map((field) => {
          return (
            <div
              key={`row-${record.id}-${field.field.id}`}
              className="h-8 border-r p-1 overflow-hidden"
              style={{ width: `${field.width}px` }}
            >
              <RecordFieldValue field={field.field} />
            </div>
          );
        })}
        <div className="w-8" />
      </div>
    </RecordProvider>
  );
};
