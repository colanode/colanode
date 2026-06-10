import { DatabaseViewFilterAttributes, FieldAttributes } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Link } from '@colanode/ui/components/ui/link';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useCollectionQuery } from '@colanode/ui/hooks/use-collection-query';

interface CalendarViewNoValueListProps {
  filters: DatabaseViewFilterAttributes[];
  field: FieldAttributes;
}

export const CalendarViewNoValueList = ({
  filters,
  field,
}: CalendarViewNoValueListProps) => {
  const view = useDatabaseView();

  const { data } = useCollectionQuery(filters, view.sorts);
  const rows = data;

  return (
    <div className="flex flex-col gap-2 overflow-y-auto">
      {rows.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          No records with no {field.name} value
        </div>
      )}
      {rows.map((row) => {
        const name = row.name ?? 'Unnamed';
        const avatar = row.source.avatar;

        if (row.nodeType === 'page') {
          return (
            <Link
              from="/workspace/$userId"
              to="$nodeId"
              params={{ nodeId: row.id }}
              key={row.id}
              className="flex flex-row items-center border rounded-md p-1 gap-2 cursor-pointer hover:bg-muted"
            >
              <Avatar
                id={row.id}
                name={name}
                avatar={avatar}
                size="small"
              />
              <p>{name}</p>
            </Link>
          );
        }

        return (
          <Link
            from="/workspace/$userId/$nodeId"
            to="modal/$modalNodeId"
            params={{ modalNodeId: row.id }}
            key={row.id}
            className="flex flex-row items-center border rounded-md p-1 gap-2 cursor-pointer hover:bg-muted"
          >
            <Avatar
              id={row.id}
              name={name}
              avatar={avatar}
              size="small"
            />
            <p>{name}</p>
          </Link>
        );
      })}
    </div>
  );
};
