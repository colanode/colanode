import debounce from 'lodash/debounce';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';

interface SmartNumberInputProps {
  value: number | null;
  onChange: (newValue: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
}

const SmartNumberInput = React.forwardRef<
  HTMLInputElement,
  SmartNumberInputProps
>(
  (
    { value, onChange, className, min, max, step = 1, readOnly, ...props },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState(value?.toString() ?? '');
    const initialValue = React.useRef(value?.toString() ?? '');

    // Create a debounced version of onChange
    const debouncedOnChange = React.useMemo(
      () => debounce((value: number) => onChange(value), 500),
      [onChange]
    );

    // Update localValue when value prop changes
    React.useEffect(() => {
      setLocalValue(value?.toString() ?? '');
      initialValue.current = value?.toString() ?? '';
    }, [value]);

    // Cleanup debounce on unmount
    React.useEffect(() => {
      return () => {
        debouncedOnChange.cancel();
      };
    }, [debouncedOnChange]);

    const handleBlur = () => {
      const newValue = parseFloat(localValue);
      if (!isNaN(newValue) && localValue !== initialValue.current) {
        debouncedOnChange.cancel(); // Cancel any pending debounced calls
        onChange(applyConstraints(newValue));
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        setLocalValue(initialValue.current); // Revert to initial value
        debouncedOnChange.cancel(); // Cancel any pending debounced calls
      } else if (event.key === 'Enter') {
        const newValue = parseFloat(localValue);
        if (!isNaN(newValue) && localValue !== initialValue.current) {
          onChange(applyConstraints(newValue)); // Fire onChange immediately when Enter is pressed
          debouncedOnChange.cancel(); // Cancel any pending debounced calls
        }
      }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      const parsedValue = parseFloat(newValue);
      if (!isNaN(parsedValue)) {
        debouncedOnChange(applyConstraints(parsedValue)); // Trigger debounced onChange
      }
    };

    const applyConstraints = (value: number): number => {
      let constrainedValue = value;
      if (min !== undefined) {
        constrainedValue = Math.max(min, constrainedValue);
      }
      if (max !== undefined) {
        constrainedValue = Math.min(max, constrainedValue);
      }
      return Math.round(constrainedValue / step) * step;
    };

    return (
      <input
        type="number"
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        step={step}
        min={min}
        max={max}
        readOnly={readOnly}
        {...props}
      />
    );
  }
);

SmartNumberInput.displayName = 'SmartNumberInput';

export { SmartNumberInput };
