import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { FieldAttributes, FieldType } from '@colanode/core';
import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@colanode/ui/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { cn } from '@colanode/ui/lib/utils';

interface FieldSelectProps {
  fields: FieldAttributes[];
  value: string | null;
  onChange: (field: string) => void;
}

export const FieldSelect = ({ fields, value, onChange }: FieldSelectProps) => {
  const [open, setOpen] = useState(false);
  const selectedField = fields.find((field) => field.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between p-2"
        >
          <span className="flex flex-row items-center gap-1">
            <FieldIcon
              type={selectedField?.type as FieldType}
              className="size-4"
            />
            {value ? selectedField?.name : 'Select field...'}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <Command className="min-h-min">
          <CommandInput placeholder="Search field types..." className="h-9" />
          <CommandEmpty>No field type found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min">
              {fields.map((field) => (
                <CommandItem
                  key={field.id}
                  onSelect={() => {
                    onChange(field.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <FieldIcon type={field.type} className="size-4" />
                    <p>{field.name}</p>
                    <Check
                      className={cn(
                        'ml-auto size-4',
                        value === field.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
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
