import { FieldType } from '@colanode/core';
import { FieldCreatePopover } from '@colanode/ui/components/databases/fields/field-create-popover';
import { FieldSelect } from '@colanode/ui/components/databases/fields/field-select';
import { Button } from '@colanode/ui/components/ui/button';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

const boardGroupFields: FieldType[] = [
  'select',
  'multi_select',
  'collaborator',
  'created_by',
];

export const BoardViewNoGroup = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  const possibleGroupByFields = database.fields.filter((field) =>
    boardGroupFields.includes(field.type)
  );

  return (
    <div className="flex w-full flex-col items-center justify-center pt-20">
      {possibleGroupByFields.length > 0 ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm">
            Please select a group you want to group the board by.
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
            There is no field that can be used to group the board by. Please
            create a new field that can be used to group the board by.
          </p>
          <FieldCreatePopover
            button={
              <Button variant="outline" size="sm">
                Add field
              </Button>
            }
            types={boardGroupFields}
            onSuccess={(fieldId) => {
              view.setGroupBy(fieldId);
            }}
          />
        </div>
      )}
    </div>
  );
};
