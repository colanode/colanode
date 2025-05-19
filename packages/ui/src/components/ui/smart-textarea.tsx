import debounce from 'lodash/debounce';
import * as React from 'react';

import { cn } from '@colanode/ui/lib/utils';

interface SmartTextareaProps {
  value: string | null;
  onChange: (newValue: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

const SmartTextarea = React.forwardRef<HTMLTextAreaElement, SmartTextareaProps>(
  ({ value, onChange, className, readOnly, placeholder, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(value ?? '');
    const initialValue = React.useRef(value ?? '');

    // Create a debounced version of onChange
    const debouncedOnChange = React.useMemo(
      () => debounce((value: string) => onChange(value), 500),
      [onChange]
    );

    // Update localValue when value prop changes
    React.useEffect(() => {
      setLocalValue(value ?? '');
      initialValue.current = value ?? '';
    }, [value]);

    // Cleanup debounce on unmount
    React.useEffect(() => {
      return () => {
        debouncedOnChange.cancel();
      };
    }, [debouncedOnChange]);

    const handleBlur = () => {
      if (localValue !== initialValue.current) {
        debouncedOnChange.cancel(); // Cancel any pending debounced calls
        onChange(localValue);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Escape') {
        setLocalValue(initialValue.current); // Revert to initial value
        debouncedOnChange.cancel(); // Cancel any pending debounced calls
      } else if (event.key === 'Enter') {
        if (localValue !== initialValue.current) {
          onChange(localValue); // Fire onChange immediately when Enter is pressed
          debouncedOnChange.cancel(); // Cancel any pending debounced calls
        }
      }
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      debouncedOnChange(newValue);
    };

    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        placeholder={placeholder}
        {...props}
      />
    );
  }
);

SmartTextarea.displayName = 'SmartTextarea';

export { SmartTextarea };
