import React from 'react';

import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { useDatabase } from '@/renderer/contexts/database';
import { useView } from '@/renderer/contexts/view';

interface ViewFilterAddPopoverProps {
  children: React.ReactNode;
}

export const ViewFilterAddPopover = ({
  children,
}: ViewFilterAddPopoverProps) => {
  const database = useDatabase();
  const view = useView();

  const [open, setOpen] = React.useState(false);
  const fieldsWithoutFilters = database.fields.filter(
    (field) =>
      !view.filters.some(
        (filter) => filter.type === 'field' && filter.fieldId === field.id
      )
  );

  if (fieldsWithoutFilters.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <Command className="min-h-min">
          <CommandInput placeholder="Search fields..." className="h-9" />
          <CommandEmpty>No field found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min max-h-96">
              {fieldsWithoutFilters.map((field) => (
                <CommandItem
                  key={field.id}
                  onSelect={() => {
                    view.initFieldFilter(field.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <FieldIcon type={field.type} className="size-4" />
                    <p>{field.name}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
