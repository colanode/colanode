import { extractNodeRole, RecordNode } from '@colanode/core';

import { TableViewNameCell } from '@/renderer/components/databases/tables/table-view-name-cell';
import { RecordFieldValue } from '@/renderer/components/records/record-field-value';
import { RecordProvider } from '@/renderer/components/records/record-provider';
import { useDatabase } from '@/renderer/contexts/database';
import { useView } from '@/renderer/contexts/view';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface TableViewRowProps {
  index: number;
  record: RecordNode;
}

export const TableViewRow = ({ index, record }: TableViewRowProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useView();
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
          className="h-8 border-r"
          style={{ width: `${view.nameWidth}px`, minWidth: '300px' }}
        >
          <TableViewNameCell record={record} />
        </div>
        {view.fields.map((field) => {
          return (
            <div
              key={`row-${record.id}-${field.field.id}`}
              className="h-8 border-r p-1"
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
