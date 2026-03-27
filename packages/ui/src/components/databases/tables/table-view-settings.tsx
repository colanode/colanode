import { Lock, LockOpen, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

import { ViewAvatarInput } from '@colanode/ui/components/databases/view-avatar-input';
import { ViewFieldSettings } from '@colanode/ui/components/databases/view-field-settings';
import { ViewRenameInput } from '@colanode/ui/components/databases/view-rename-input';
import { ViewSettingsButton } from '@colanode/ui/components/databases/view-settings-button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@colanode/ui/components/ui/alert-dialog';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useDatabaseViews } from '@colanode/ui/contexts/database-views';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const TableViewSettings = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();
  const databaseViews = useDatabaseViews();

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const canDeleteView = databaseViews.views.length > 1;

  const handleDeleteView = () => {
    const nextViewId =
      databaseViews.views.find((candidate) => candidate.id !== view.id)?.id ??
      '';

    workspace.collections.nodes.delete(view.id);
    databaseViews.onActiveViewChange(nextViewId);
    setOpenDelete(false);
    setOpen(false);
  };

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
              readOnly={!database.canEdit || database.isLocked}
            />
            <ViewRenameInput
              id={view.id}
              name={view.name}
              readOnly={!database.canEdit || database.isLocked}
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
                    database.toggleLock();
                  }}
                >
                  {database.isLocked ? (
                    <LockOpen className="size-4" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  <span>
                    {database.isLocked ? 'Unlock database' : 'Lock database'}
                  </span>
                </div>
                {canDeleteView && !database.isLocked && (
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
                )}
              </div>
            </Fragment>
          )}
        </PopoverContent>
      </Popover>
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want delete this view?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This view will no longer be
              accessible and all data in the view will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteView}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
};
