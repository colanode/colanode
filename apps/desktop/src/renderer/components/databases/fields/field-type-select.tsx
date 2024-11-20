import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Button } from '@/renderer/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import { FieldType } from '@colanode/core';
import { cn } from '@/shared/lib/utils';
import { FieldIcon } from './field-icon';
import { Check, ChevronsUpDown } from 'lucide-react';

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
    type: 'createdAt',
  },
  {
    name: 'Created by user',
    type: 'createdBy',
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
    name: 'File',
    type: 'file',
  },
  {
    name: 'Multi Select',
    type: 'multiSelect',
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
    name: 'Text',
    type: 'text',
  },
  {
    name: 'Url',
    type: 'url',
  },
  {
    name: 'Last Updated Date & Time',
    type: 'updatedAt',
  },
  {
    name: 'Last Updated by user',
    type: 'updatedBy',
  },
];

interface FieldTypeSelectProps {
  type: string | null;
  onChange: (type: FieldType) => void;
}

export const FieldTypeSelect = ({ type, onChange }: FieldTypeSelectProps) => {
  const [open, setOpen] = React.useState(false);

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
            <FieldIcon type={type as FieldType} className="size-4" />
            {type
              ? fieldTypes.find((fieldType) => fieldType.type === type)?.name
              : 'Select field type...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1 overflow-hidden">
        <Command className="min-h-min">
          <CommandInput placeholder="Search field types..." className="h-9" />
          <CommandEmpty>No field type found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min overflow-y-auto">
              {fieldTypes.map((fieldType) => (
                <CommandItem
                  key={fieldType.type}
                  value={`${fieldType.type} - ${fieldType.name}`}
                  onSelect={() => {
                    onChange(fieldType.type);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <FieldIcon type={fieldType.type} className="size-4" />
                    <p>{fieldType.name}</p>
                    <Check
                      className={cn(
                        'ml-auto size-4',
                        type === fieldType.type ? 'opacity-100' : 'opacity-0'
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
