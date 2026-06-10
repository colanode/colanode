import { CircleDashed } from 'lucide-react';
import { useMemo } from 'react';

import { DatabaseViewFilterAttributes, FieldAttributes } from '@colanode/core';
import { CalendarViewNoValueList } from '@colanode/ui/components/databases/calendars/calendar-view-no-value-list';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@colanode/ui/components/ui/dialog';
import {
  ScrollArea,
  ScrollViewport,
  ScrollBar,
} from '@colanode/ui/components/ui/scroll-area';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useCollectionQuery } from '@colanode/ui/hooks/use-collection-query';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { filterCollectionRows } from '@colanode/ui/lib/collection-view-query';

interface CalendarViewNoValueCountProps {
  field: FieldAttributes;
}

export const CalendarViewNoValueCount = ({
  field,
}: CalendarViewNoValueCountProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const isMetaType = (database.purpose ?? 'records') === 'meta_type';

  const filters: DatabaseViewFilterAttributes[] = [
    ...view.filters,
    {
      id: 'no_value',
      type: 'field',
      fieldId: field.id,
      operator: 'is_empty',
    },
  ];

  const noValueCountQuery = useLiveQuery(
    {
      type: 'record.field.value.count',
      databaseId: database.id,
      filters: filters,
      fieldId: field.id,
      userId: workspace.userId,
    },
    { enabled: !isMetaType }
  );

  const { data } = useCollectionQuery(view.filters, view.sorts);
  const metaTypeNoValueCount = useMemo(() => {
    if (!isMetaType) {
      return 0;
    }

    return filterCollectionRows(
      data,
      {
        id: 'no_value',
        type: 'field',
        fieldId: field.id,
        operator: 'is_empty',
      },
      database.fields,
      workspace.userId
    ).length;
  }, [data, database.fields, field.id, isMetaType, workspace.userId]);

  const noValueCount = isMetaType
    ? metaTypeNoValueCount
    : (noValueCountQuery.data?.noValueCount ?? 0);

  if (noValueCount === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className="flex flex-row items-center gap-1 text-sm mr-2 hover:bg-muted hover:cursor-pointer rounded-md p-1"
          role="presentation"
        >
          <CircleDashed className="size-4" />
          <p>No {field.name}</p>
          <p>({noValueCount.toLocaleString()})</p>
        </div>
      </DialogTrigger>
      <DialogContent className="w-128 min-w-128 min-h-40 overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>{view.name}</DialogTitle>
          <DialogDescription>
            Record with no {field.name} value ({noValueCount.toLocaleString()})
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96">
          <ScrollViewport>
            <div className="max-h-none overflow-hidden pr-4">
              <CalendarViewNoValueList filters={filters} field={field} />
            </div>
          </ScrollViewport>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
