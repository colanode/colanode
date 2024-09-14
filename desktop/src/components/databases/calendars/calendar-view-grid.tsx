import React from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn, getDisplayedDates, toUTCDate } from '@/lib/utils';
import { DayPicker, DayProps } from 'react-day-picker';
import { CalendarViewDay } from '@/components/databases/calendars/calendar-view-day';
import { CalendarViewNode, FieldNode, ViewFilterNode } from '@/types/databases';
import { useRecordsQuery } from '@/queries/use-records-query';
import { useDatabase } from '@/contexts/database';
import { filterRecords } from '@/lib/databases';
import { useWorkspace } from '@/contexts/workspace';

interface CalendarViewGridProps {
  view: CalendarViewNode;
  field: FieldNode;
}

export const CalendarViewGrid = ({ view, field }: CalendarViewGridProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const [month, setMonth] = React.useState(new Date());
  const { first, last } = getDisplayedDates(month);

  const filters = [
    ...view.filters,
    {
      id: 'start_date',
      fieldId: field.id,
      operator: 'is_on_or_after',
      values: [
        {
          textValue: first.toISOString(),
          numberValue: null,
          foreignNodeId: null,
        },
      ],
    },
    {
      id: 'end_date',
      fieldId: field.id,
      operator: 'is_on_or_before',
      values: [
        {
          textValue: last.toISOString(),
          numberValue: null,
          foreignNodeId: null,
        },
      ],
    },
  ];

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useRecordsQuery(database.id, filters, view.sorts);

  if (isPending) {
    return null;
  }

  const records = data ?? [];
  return (
    <DayPicker
      showOutsideDays
      className="p-3"
      month={month}
      onMonthChange={(month) => {
        setMonth(month);
      }}
      classNames={{
        months:
          'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full',
        month: 'space-y-4 w-full',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex flex-row mb-2',
        head_cell:
          'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]',
        row: 'flex flex-row w-full border-b first:border-t',
        cell: cn(
          'relative flex-1 h-40 p-2 text-right text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent',
          '[&:has([aria-selected])]:rounded-md',
          'border-r first:border-l border-gray-100 overflow-auto',
        ),
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <Icon name="arrow-left-s-line" className="h-4 w-4" {...props} />
        ),
        IconRight: ({ ...props }) => (
          <Icon name="arrow-right-s-line" className="h-4 w-4" {...props} />
        ),
        Day: (props: DayProps) => {
          const filter: ViewFilterNode = {
            id: 'calendar_filter',
            fieldId: field.id,
            operator: 'is_equal_to',
            values: [
              {
                textValue: props.date.toISOString(),
                numberValue: null,
                foreignNodeId: null,
              },
            ],
          };

          const dayRecords = filterRecords(
            records,
            filter,
            field,
            workspace.userId,
          );

          return (
            <CalendarViewDay
              date={toUTCDate(props.date)}
              month={props.displayMonth}
              records={dayRecords}
            />
          );
        },
      }}
    />
  );
};