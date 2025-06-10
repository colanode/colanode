import { Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

import { FieldAttributes } from '@colanode/core';
import { FieldDeleteDialog } from '@colanode/ui/components/databases/fields/field-delete-dialog';
import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import { FieldRenameInput } from '@colanode/ui/components/databases/fields/field-rename-input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useDatabase } from '@colanode/ui/contexts/database';

interface RecordFieldProps {
  field: FieldAttributes;
}

export const RecordField = ({ field }: RecordFieldProps) => {
  const database = useDatabase();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <Fragment>
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <div className="flex h-8 w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm hover:bg-gray-50">
            <FieldIcon type={field.type} className="size-4" />
            <p>{field.name}</p>
          </div>
        </PopoverTrigger>
        <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
          <FieldRenameInput field={field} />
          <Separator />
          {database.canEdit && (
            <div
              className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
              onClick={() => {
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="size-4" />
              <span>Delete field</span>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {showDeleteDialog && (
        <FieldDeleteDialog
          id={field.id}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />
      )}
    </Fragment>
  );
};
