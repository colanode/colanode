import {
  extractNodeRole,
  SelectFieldAttributes,
  SelectOptionAttributes,
  ViewFilterAttributes,
} from '@colanode/core';
import { BoardViewCard } from '@/renderer/components/databases/boards/board-view-card';
import { useView } from '@/renderer/contexts/view';
import { useRecordsQuery } from '@/renderer/hooks/user-records-query';
import { RecordProvider } from '@/renderer/components/records/record-provider';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useDatabase } from '@/renderer/contexts/database';

interface BoardViewColumnRecordsProps {
  field: SelectFieldAttributes;
  option: SelectOptionAttributes;
}

export const BoardViewColumnRecords = ({
  field,
  option,
}: BoardViewColumnRecordsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useView();

  const filters: ViewFilterAttributes[] = [
    ...view.filters,
    {
      id: '1',
      type: 'field',
      fieldId: field.id,
      operator: 'is_in',
      value: [option.id],
    },
  ];
  const { records } = useRecordsQuery(filters, view.sorts);
  return (
    <div className="mt-3 flex flex-col gap-2">
      {records.map((record) => {
        const role = extractNodeRole(record, workspace.userId) ?? database.role;

        return (
          <RecordProvider key={record.id} record={record} role={role}>
            <BoardViewCard />
          </RecordProvider>
        );
      })}
    </div>
  );
};
