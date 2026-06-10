import { Plus } from 'lucide-react';

import { extractNodeRole, isSameDay } from '@colanode/core';
import { CollectionViewCard } from '@colanode/ui/components/databases/collection-view-card';
import { PageFieldsProvider } from '@colanode/ui/components/pages/page-fields-provider';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { CollectionRow } from '@colanode/ui/lib/collection-row';
import { cn } from '@colanode/ui/lib/utils';

interface CalendarViewDayProps {
  date: Date;
  rows: CollectionRow[];
  isOutside: boolean;
  onCreate?: () => void;
}

export const CalendarViewDay = ({
  date,
  rows,
  isOutside,
  onCreate,
}: CalendarViewDayProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const isToday = isSameDay(date, new Date());

  return (
    <td className="animate-fade-in group/calendar-day flex w-full flex-col gap-1 h-40 p-2 border-r first:border-l border-border overflow-auto">
      <div
        className={cn(
          'flex w-full justify-end text-sm',
          isOutside ? 'text-muted-foreground' : ''
        )}
      >
        {onCreate && (
          <div className="grow">
            <Plus
              className="size-4 cursor-pointer opacity-0 group-hover/calendar-day:opacity-100"
              onClick={onCreate}
            />
          </div>
        )}
        <p
          className={
            isToday
              ? 'rounded-md bg-red-500 dark:bg-red-900 py-1 px-2 text-white'
              : ''
          }
        >
          {date.getDate()}
        </p>
      </div>
      {rows.map((row) => {
        const role =
          extractNodeRole(row.source, workspace.userId) ?? database.role;

        if (row.nodeType === 'page') {
          return (
            <PageFieldsProvider key={row.id} page={row.source} role={role}>
              <CollectionViewCard row={row} compact />
            </PageFieldsProvider>
          );
        }

        return (
          <RecordProvider key={row.id} record={row.source} role={role}>
            <CollectionViewCard row={row} compact />
          </RecordProvider>
        );
      })}
    </td>
  );
};
