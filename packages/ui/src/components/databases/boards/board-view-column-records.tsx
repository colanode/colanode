import { extractNodeRole, DatabaseViewFilterAttributes } from '@colanode/core';
import { BoardViewRecordCard } from '@colanode/ui/components/databases/boards/board-view-record-card';
import { BoardViewRecordCreateCard } from '@colanode/ui/components/databases/boards/board-view-record-create-card';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useBoardView } from '@colanode/ui/contexts/board-view';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useRecordsQuery } from '@colanode/ui/hooks/use-records-query';

export const BoardViewColumnRecords = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const boardView = useBoardView();

  const filters: DatabaseViewFilterAttributes[] = [
    ...view.filters,
    boardView.filter,
  ];

  const { records } = useRecordsQuery(filters, view.sorts);
  return (
    <div className="mt-3 flex flex-col gap-2">
      {records.map((record) => {
        const role = extractNodeRole(record, workspace.userId) ?? database.role;

        return (
          <RecordProvider key={record.id} record={record} role={role}>
            <BoardViewRecordCard />
          </RecordProvider>
        );
      })}
      <BoardViewRecordCreateCard filters={filters} />
    </div>
  );
};
