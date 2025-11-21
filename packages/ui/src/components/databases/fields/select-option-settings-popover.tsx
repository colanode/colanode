import { Ellipsis, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

import { SelectOptionAttributes } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { SelectOptionDeleteDialog } from '@colanode/ui/components/databases/fields/select-option-delete-dialog';
import { Label } from '@colanode/ui/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { selectOptionColors } from '@colanode/ui/lib/databases';
import { cn } from '@colanode/ui/lib/utils';

interface SelectOptionSettingsPopoverProps {
  fieldId: string;
  option: SelectOptionAttributes;
}

export const SelectOptionSettingsPopover = ({
  fieldId,
  option,
}: SelectOptionSettingsPopoverProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const [openSetttingsPopover, setOpenSetttingsPopover] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  return (
    <Fragment>
      <Popover
        modal={true}
        open={openSetttingsPopover}
        onOpenChange={setOpenSetttingsPopover}
      >
        <PopoverTrigger className="flex cursor-pointer items-center justify-center">
          <Ellipsis className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
          <div className="p-1">
            <SmartTextInput
              value={option.name}
              onChange={(newName) => {
                if (newName === option.name) return;

                const nodes = collections.workspace(workspace.userId).nodes;
                nodes.update(database.id, (draft) => {
                  if (draft.type !== 'database') {
                    return;
                  }

                  const fieldAttributes = draft.fields[fieldId];
                  if (!fieldAttributes) {
                    return;
                  }

                  if (
                    fieldAttributes.type !== 'select' &&
                    fieldAttributes.type !== 'multi_select'
                  ) {
                    return;
                  }

                  if (!fieldAttributes.options) {
                    return;
                  }

                  const selectOption = fieldAttributes.options[option.id];
                  if (!selectOption) {
                    return;
                  }

                  selectOption.name = newName;
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
                className="flex cursor-pointer flex-row items-center gap-2 rounded-md p-1 hover:bg-accent"
                onClick={() => {
                  const nodes = collections.workspace(workspace.userId).nodes;
                  nodes.update(database.id, (draft) => {
                    if (draft.type !== 'database') {
                      return;
                    }

                    const fieldAttributes = draft.fields[fieldId];
                    if (!fieldAttributes) {
                      return;
                    }

                    if (
                      fieldAttributes.type !== 'select' &&
                      fieldAttributes.type !== 'multi_select'
                    ) {
                      return;
                    }

                    if (!fieldAttributes.options) {
                      return;
                    }

                    const selectOption = fieldAttributes.options[option.id];
                    if (!selectOption) {
                      return;
                    }

                    selectOption.color = color.value;
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
            className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-accent rounded-md"
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
    </Fragment>
  );
};
