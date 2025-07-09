import { InView } from 'react-intersection-observer';

import { DatabaseViewFilterAttributes, FieldAttributes } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useRecordsQuery } from '@colanode/ui/hooks/use-records-query';

interface CalendarViewNoValueListProps {
  filters: DatabaseViewFilterAttributes[];
  field: FieldAttributes;
}

export const CalendarViewNoValueList = ({
  filters,
  field,
}: CalendarViewNoValueListProps) => {
  const view = useDatabaseView();
  const layout = useLayout();

  const { records, hasMore, loadMore, isPending } = useRecordsQuery(
    filters,
    view.sorts
  );

  return (
    <div className="flex flex-col gap-2 overflow-y-auto">
      {records.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          No records with no {field.name} value
        </div>
      )}
      {records.map((record) => {
        const name = record.attributes.name ?? 'Unnamed';
        return (
          <div
            key={record.id}
            className="flex flex-row items-center border rounded-md p-1 gap-2 cursor-pointer hover:bg-muted"
            onClick={() => {
              layout.previewLeft(record.id, true);
            }}
          >
            <Avatar
              id={record.id}
              name={name}
              avatar={record.attributes.avatar}
              size="small"
            />
            <p>{name}</p>
          </div>
        );
      })}
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (inView && hasMore && !isPending) {
            loadMore();
          }
        }}
      ></InView>
    </div>
  );
};
