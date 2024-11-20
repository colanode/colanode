import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { useView } from '@/renderer/contexts/view';
import { Separator } from '@/renderer/components/ui/separator';
import { useDatabase } from '@/renderer/contexts/database';
import { cn } from '@/shared/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { FieldDeleteDialog } from '@/renderer/components/databases/fields/field-delete-dialog';
import { ViewDeleteDialog } from '@/renderer/components/databases/view-delete-dialog';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { AvatarPopover } from '@/renderer/components/avatars/avatar-popover';
import { Button } from '@/renderer/components/ui/button';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { Eye, EyeOff, Settings, Trash2 } from 'lucide-react';
import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';
import { ViewIcon } from '../view-icon';

export const TableViewSettingsPopover = () => {
  const database = useDatabase();
  const view = useView();

  const [open, setOpen] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [deleteFieldId, setDeleteFieldId] = React.useState<string | null>(null);

  return (
    <React.Fragment>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <div className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
            <Settings className="size-4" />
          </div>
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
                    type={view.type}
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
                  type={view.type}
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
              const isHidden = !!view.fields.find(
                (f) => f.field.id === field.id
              );

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

                            view.setFieldDisplay(field.id, !isHidden);
                          }}
                        >
                          {isHidden ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="flex flex-row items-center gap-2">
                        {isHidden
                          ? 'Show field in this view'
                          : 'Hide field from this view'}
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
            <React.Fragment>
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
            </React.Fragment>
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
    </React.Fragment>
  );
};
