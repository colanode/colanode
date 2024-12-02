import { SelectOptionAttributes } from '@colanode/core';
import { Ellipsis, Trash2 } from 'lucide-react';
import React from 'react';

import { SelectOptionDeleteDialog } from '@/renderer/components/databases/fields/select-option-delete-dialog';
import { Label } from '@/renderer/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Separator } from '@/renderer/components/ui/separator';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useDatabase } from '@/renderer/contexts/database';
import { selectOptionColors } from '@/shared/lib/databases';
import { cn } from '@/shared/lib/utils';

interface SelectOptionSettingsPopoverProps {
  fieldId: string;
  option: SelectOptionAttributes;
}

export const SelectOptionSettingsPopover = ({
  fieldId,
  option,
}: SelectOptionSettingsPopoverProps) => {
  const database = useDatabase();

  const [openSetttingsPopover, setOpenSetttingsPopover] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);

  return (
    <React.Fragment>
      <Popover
        modal={true}
        open={openSetttingsPopover}
        onOpenChange={setOpenSetttingsPopover}
      >
        <PopoverTrigger asChild>
          <Ellipsis className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
          <div className="p-1">
            <SmartTextInput
              value={option.name}
              onChange={(newName) => {
                if (newName === option.name) return;

                database.updateSelectOption(fieldId, {
                  ...option,
                  name: newName,
                });
              }}
            />
          </div>
          <Separator className="my-1" />
          <Label>Color</Label>
          {selectOptionColors.map((color) => {
            return (
              <div
                key={color.value}
                className="flex cursor-pointer flex-row items-center gap-2 rounded-md p-1 hover:bg-gray-100"
                onClick={() => {
                  database.updateSelectOption(fieldId, {
                    ...option,
                    color: color.value,
                  });
                }}
              >
                <span className={cn('h-4 w-4 rounded-md', color.class)} />
                <span>{color.label}</span>
              </div>
            );
          })}
          <Separator className="my-1" />
          <div
            className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
            onClick={() => {
              setOpenDeleteDialog(true);
              setOpenSetttingsPopover(false);
            }}
          >
            <Trash2 className="size-4" />
            <span>Delete option</span>
          </div>
        </PopoverContent>
      </Popover>
      <SelectOptionDeleteDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        fieldId={fieldId}
        optionId={option.id}
      />
    </React.Fragment>
  );
};
