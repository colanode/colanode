import React from 'react';
import { buttonVariants } from '@/renderer/components/ui/button';
import {
  cn,
  getDisplayedDates,
  isSameDay,
  toUTCDate,
} from '@/shared/lib/utils';
import { DayPicker, DayProps } from 'react-day-picker';
import { CalendarViewDay } from '@/renderer/components/databases/calendars/calendar-view-day';
import { FieldAttributes, ViewFilterAttributes } from '@colanode/core';
import { useRecordsQuery } from '@/renderer/hooks/user-records-query';
import { filterRecords } from '@/shared/lib/databases';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useView } from '@/renderer/contexts/view';
import { useDatabase } from '@/renderer/contexts/database';

interface CalendarViewGridProps {
  field: FieldAttributes;
}

export const CalendarViewGrid = ({ field }: CalendarViewGridProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useView();

  const [month, setMonth] = React.useState(new Date());
  const { first, last } = getDisplayedDates(month);

  const filters: ViewFilterAttributes[] = [
    ...view.filters,
    {
      id: 'start_date',
      type: 'field',
      fieldId: field.id,
      operator: 'is_on_or_after',
      value: first.toISOString(),
    },
    {
      id: 'end_date',
      type: 'field',
      fieldId: field.id,
      operator: 'is_on_or_before',
      value: last.toISOString(),
    },
  ];

  const { records } = useRecordsQuery(filters, view.sorts, 200);

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
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
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
          'border-r first:border-l border-gray-100 overflow-auto'
        ),
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <ChevronLeft className="size-4" {...props} />
        ),
        IconRight: ({ ...props }) => (
          <ChevronRight className="size-4" {...props} />
        ),
        Day: (props: DayProps) => {
          const filter: ViewFilterAttributes = {
            id: 'calendar_filter',
            type: 'field',
            fieldId: field.id,
            operator: 'is_equal_to',
            value: props.date.toISOString(),
          };

          const dayRecords = filterRecords(
            records,
            filter,
            field,
            workspace.userId
          );

          const canCreate =
            (field.type === 'createdAt' && isSameDay(props.date, new Date())) ||
            field.type === 'date';

          const onCreate =
            database.canCreateRecord && canCreate
              ? () => view.createRecord([filter])
              : undefined;

          return (
            <CalendarViewDay
              date={toUTCDate(props.date)}
              month={props.displayMonth}
              records={dayRecords}
              onCreate={onCreate}
            />
          );
        },
      }}
    />
  );
};
