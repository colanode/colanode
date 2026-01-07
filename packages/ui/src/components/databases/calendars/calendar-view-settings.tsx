import { Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

import { ViewAvatarInput } from '@colanode/ui/components/databases/view-avatar-input';
import { ViewFieldSettings } from '@colanode/ui/components/databases/view-field-settings';
import { ViewRenameInput } from '@colanode/ui/components/databases/view-rename-input';
import { ViewSettingsButton } from '@colanode/ui/components/databases/view-settings-button';
import { NodeDeleteDialog } from '@colanode/ui/components/nodes/node-delete-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const CalendarViewSettings = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <Fragment>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <ViewSettingsButton />
        </PopoverTrigger>
        <PopoverContent className="mr-4 flex w-90 flex-col gap-1.5 p-2">
          <div className="flex flex-row items-center gap-2">
            <ViewAvatarInput
              id={view.id}
              name={view.name}
              avatar={view.avatar}
              layout={view.layout}
              readOnly={!database.canEdit}
            />
            <ViewRenameInput
              id={view.id}
              name={view.name}
              readOnly={!database.canEdit}
            />
          </div>
          <Separator />
          <ViewFieldSettings />
          {database.canEdit && (
            <Fragment>
              <Separator />
              <div className="flex flex-col gap-2 text-sm">
                <p className="my-1 font-semibold">Settings</p>
                <div
                  className="flex cursor-pointer flex-row items-center gap-1 rounded-md p-0.5 hover:bg-accent"
                  onClick={() => {
                    setOpenDelete(true);
                    setOpen(false);
                  }}
                >
                  <Trash2 className="size-4" />
                  <span>Delete view</span>
                </div>
              </div>
            </Fragment>
          )}
        </PopoverContent>
      </Popover>
      {openDelete && (
        <NodeDeleteDialog
          title="Are you sure you want delete this view?"
          description="This action cannot be undone. This view will no longer be accessible and all data in the view will be lost."
          id={view.id}
          open={openDelete}
          onOpenChange={setOpenDelete}
        />
      )}
    </Fragment>
  );
};
