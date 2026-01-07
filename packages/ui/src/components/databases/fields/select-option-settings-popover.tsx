import { debounceStrategy, usePacedMutations } from '@tanstack/react-db';
import { Ellipsis, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

import { LocalNode } from '@colanode/client/types';
import { SelectOptionAttributes } from '@colanode/core';
import { SelectOptionDeleteDialog } from '@colanode/ui/components/databases/fields/select-option-delete-dialog';
import { Input } from '@colanode/ui/components/ui/input';
import { Label } from '@colanode/ui/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { selectOptionColors } from '@colanode/ui/lib/databases';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';
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

  const mutateName = usePacedMutations<string, LocalNode>({
    onMutate: (newName) => {
      workspace.collections.nodes.update(database.id, (draft) => {
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
    },
    mutationFn: async ({ transaction }) => {
      await applyNodeTransaction(workspace.userId, transaction);
    },
    strategy: debounceStrategy({ wait: 500 }),
  });

  const mutateColor = usePacedMutations<string, LocalNode>({
    onMutate: (newColor) => {
      workspace.collections.nodes.update(database.id, (draft) => {
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

        selectOption.color = newColor;
      });
    },
    mutationFn: async ({ transaction }) => {
      await applyNodeTransaction(workspace.userId, transaction);
    },
    strategy: debounceStrategy({ wait: 500 }),
  });

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
            <Input
              value={option.name}
              onChange={(event) => {
                const newName = event.target.value;
                if (newName === option.name) return;

                mutateName(newName);
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
                  mutateColor(color.value);
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
