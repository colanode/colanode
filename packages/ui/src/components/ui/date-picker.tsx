import { useState } from 'react';

import { Calendar } from '@colanode/ui/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { cn } from '@colanode/ui/lib/utils';

interface DatePickerProps {
  value: Date | null;
  className?: string;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  readonly?: boolean;
}

const toUTCDate = (dateParam: Date | string): Date => {
  const date = typeof dateParam === 'string' ? new Date(dateParam) : dateParam;

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
};

const fromUTCDate = (dateParam: Date | string): Date => {
  const date = typeof dateParam === 'string' ? new Date(dateParam) : dateParam;

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  return new Date(year, month, day, 0, 0, 0, 0);
};

export const DatePicker = ({
  value,
  className,
  onChange,
  placeholder,
  readonly,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const dateObj = value ? fromUTCDate(value) : undefined;
  const placeHolderText = placeholder ?? '';

  if (readonly) {
    return (
      <div
        className={cn(!dateObj && 'text-sm text-muted-foreground', className)}
      >
        {dateObj ? dateObj.toLocaleDateString() : ''}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <div
          className={cn(!dateObj && 'text-sm text-muted-foreground', className)}
        >
          {dateObj ? dateObj.toLocaleDateString() : placeHolderText}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj ?? undefined}
          onSelect={(date) => {
            if (!date) {
              onChange(null);
            } else {
              onChange(toUTCDate(date));
            }
          }}
          autoFocus={true}
        />
      </PopoverContent>
    </Popover>
  );
};
