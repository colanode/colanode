import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { FieldType } from '@colanode/core';
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
import {
  ScrollArea,
  ScrollViewport,
  ScrollBar,
} from '@colanode/ui/components/ui/scroll-area';
import { cn } from '@colanode/ui/lib/utils';

interface FieldTypeOption {
  name: string;
  type: FieldType;
}

const fieldTypes: FieldTypeOption[] = [
  {
    name: 'Boolean',
    type: 'boolean',
  },
  {
    name: 'Collaborator',
    type: 'collaborator',
  },
  {
    name: 'Created Date & Time',
    type: 'created_at',
  },
  {
    name: 'Created by user',
    type: 'created_by',
  },
  {
    name: 'Date',
    type: 'date',
  },
  {
    name: 'Email',
    type: 'email',
  },
  {
    name: 'Multi Select',
    type: 'multi_select',
  },
  {
    name: 'Number',
    type: 'number',
  },
  {
    name: 'Phone',
    type: 'phone',
  },
  {
    name: 'Select',
    type: 'select',
  },
  {
    name: 'Relation',
    type: 'relation',
  },
  {
    name: 'Text',
    type: 'text',
  },
  {
    name: 'Url',
    type: 'url',
  },
  {
    name: 'Last Updated Date & Time',
    type: 'updated_at',
  },
  {
    name: 'Last Updated By',
    type: 'updated_by',
  },
];

interface FieldTypeSelectProps {
  value: string | null;
  onChange: (type: FieldType) => void;
  types?: FieldType[];
}

export const FieldTypeSelect = ({
  value,
  onChange,
  types,
}: FieldTypeSelectProps) => {
  const [open, setOpen] = useState(false);
  const filteredFieldTypes = fieldTypes.filter((fieldType) =>
    types ? types.includes(fieldType.type) : true
  );

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
            <FieldIcon type={value as FieldType} className="size-4" />
            {value
              ? fieldTypes.find((fieldType) => fieldType.type === value)?.name
              : 'Select field type...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1 overflow-hidden">
        <Command className="min-h-min">
          <CommandInput placeholder="Search field types..." className="h-9" />
          <CommandEmpty>No field type found.</CommandEmpty>
          <ScrollArea className="h-80">
            <ScrollViewport>
              <CommandList className="max-h-none overflow-hidden">
                <CommandGroup className="h-min">
                  {filteredFieldTypes.map((fieldType) => (
                    <CommandItem
                      key={fieldType.type}
                      value={`${fieldType.type} - ${fieldType.name}`}
                      onSelect={() => {
                        onChange(fieldType.type);
                        setOpen(false);
                      }}
                    >
                      <div className="flex w-full flex-row items-center gap-2">
                        <FieldIcon
                          type={fieldType.type}
                          className="size-4 text-foreground"
                        />
                        <p>{fieldType.name}</p>
                        <Check
                          className={cn(
                            'ml-auto size-4',
                            value === fieldType.type
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </ScrollViewport>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
