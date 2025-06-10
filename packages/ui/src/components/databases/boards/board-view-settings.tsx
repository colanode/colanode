import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

import { AvatarPopover } from '@colanode/ui/components/avatars/avatar-popover';
import { FieldDeleteDialog } from '@colanode/ui/components/databases/fields/field-delete-dialog';
import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import { ViewDeleteDialog } from '@colanode/ui/components/databases/view-delete-dialog';
import { ViewIcon } from '@colanode/ui/components/databases/view-icon';
import { ViewSettingsButton } from '@colanode/ui/components/databases/view-settings-button';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { cn } from '@colanode/ui/lib/utils';

export const BoardViewSettings = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

  return (
    <Fragment>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <ViewSettingsButton />
        </PopoverTrigger>
        <PopoverContent className="mr-4 flex w-[600px] flex-col gap-1.5 p-2">
          <div className="flex flex-row items-center gap-2">
            {database.canEdit ? (
              <AvatarPopover
                onPick={(avatar) => {
                  view.updateAvatar(avatar);
                }}
              >
                <Button type="button" variant="outline" size="icon">
                  <ViewIcon
                    id={view.id}
                    name={view.name}
                    avatar={view.avatar}
                    layout={view.layout}
                    className="size-4"
                  />
                </Button>
              </AvatarPopover>
            ) : (
              <Button type="button" variant="outline" size="icon">
                <ViewIcon
                  id={view.id}
                  name={view.name}
                  avatar={view.avatar}
                  layout={view.layout}
                  className="size-4"
                />
              </Button>
            )}
            <SmartTextInput
              value={view.name}
              readOnly={!database.canEdit}
              onChange={(newName) => {
                if (newName === view.name) return;

                view.rename(newName);
              }}
            />
          </div>
          <Separator />
          <div className="flex flex-col gap-2 text-sm">
            <p className="my-1 font-semibold">Fields</p>
            {database.fields.map((field) => {
              const isDisplayed =
                view.fields.find((f) => f.field.id === field.id)?.display ??
                false;

              return (
                <div
                  key={field.id}
                  className={cn(
                    'flex flex-row items-center justify-between gap-2 p-0.5',
                    'cursor-pointer rounded-md hover:bg-gray-50'
                  )}
                >
                  <div className="flex flex-row items-center gap-2">
                    <FieldIcon type={field.type} className="size-4" />
                    <div>{field.name}</div>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          className={cn(
                            database.canEdit ? 'cursor-pointer' : 'opacity-50'
                          )}
                          onClick={() => {
                            if (!database.canEdit) return;

                            view.setFieldDisplay(field.id, !isDisplayed);
                          }}
                        >
                          {isDisplayed ? (
                            <Eye className="size-4" />
                          ) : (
                            <EyeOff className="size-4" />
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="flex flex-row items-center gap-2">
                        {isDisplayed
                          ? 'Hide field from this view'
                          : 'Show field in this view'}
                      </TooltipContent>
                    </Tooltip>
                    {database.canEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Trash2
                            className={cn(
                              'size-4',
                              database.canEdit ? 'cursor-pointer' : 'opacity-50'
                            )}
                            onClick={() => {
                              setDeleteFieldId(field.id);
                              setOpen(false);
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="flex flex-row items-center gap-2">
                          Delete field from database
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {database.canEdit && (
            <Fragment>
              <Separator />
              <div className="flex flex-col gap-2 text-sm">
                <p className="my-1 font-semibold">Settings</p>
                <div
                  className="flex cursor-pointer flex-row items-center gap-1 rounded-md p-0.5 hover:bg-gray-50"
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
      {deleteFieldId && (
        <FieldDeleteDialog
          id={deleteFieldId}
          open={!!deleteFieldId}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteFieldId(null);
            }
          }}
        />
      )}
      {openDelete && (
        <ViewDeleteDialog
          id={view.id}
          open={openDelete}
          onOpenChange={setOpenDelete}
        />
      )}
    </Fragment>
  );
};
