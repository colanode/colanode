import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { Link } from '@colanode/ui/components/ui/link';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useRecord } from '@colanode/ui/contexts/record';

export const CalendarViewRecordCard = () => {
  const view = useDatabaseView();
  const record = useRecord();

  const name = record.name;
  const hasName = name !== null && name !== '';

  return (
    <Link
      from="/acc/$accountId/$workspaceId"
      to="$nodeId"
      params={{ nodeId: record.id }}
      key={record.id}
      className="animate-fade-in flex justify-start items-start cursor-pointer flex-col gap-1 rounded-md border p-1 pl-2 hover:bg-accent"
    >
      <p className={hasName ? '' : 'text-muted-foreground'}>
        {hasName ? name : 'Unnamed'}
      </p>
      {view.fields.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {view.fields.map((viewField) => {
            if (!viewField.display) {
              return null;
            }

            return (
              <div key={viewField.field.id}>
                <RecordFieldValue field={viewField.field} readOnly={true} />
              </div>
            );
          })}
        </div>
      )}
    </Link>
  );
};
