import { FieldType } from '@colanode/core';
import { FieldCreatePopover } from '@colanode/ui/components/databases/fields/field-create-popover';
import { FieldSelect } from '@colanode/ui/components/databases/fields/field-select';
import { Button } from '@colanode/ui/components/ui/button';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

const calendarGroupFields: FieldType[] = ['date', 'created_at', 'updated_at'];

export const CalendarViewNoGroup = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  const possibleGroupByFields = database.fields.filter((field) =>
    calendarGroupFields.includes(field.type)
  );

  return (
    <div className="flex w-full flex-col items-center justify-center pt-20">
      {possibleGroupByFields.length > 0 ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm">
            Please select a group you want to group the calendar by.
          </p>
          <div className="w-90">
            <FieldSelect
              fields={possibleGroupByFields}
              value={view.groupBy ?? null}
              onChange={(fieldId) => {
                view.setGroupBy(fieldId);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm">
            There is no field that can be used to group the calendar by. Please
            create a new field that can be used to group the calendar by.
          </p>
          <FieldCreatePopover
            button={
              <Button variant="outline" size="sm">
                Add field
              </Button>
            }
            types={calendarGroupFields}
            onSuccess={(fieldId) => {
              view.setGroupBy(fieldId);
            }}
          />
        </div>
      )}
    </div>
  );
};
