import { getSelectOptionStrongStyle } from '@colanode/ui/lib/databases';
import { cn } from '@colanode/ui/lib/utils';

interface SelectOptionBadgeProps {
  name: string;
  color: string;
}

export const SelectOptionBadge = ({ name, color }: SelectOptionBadgeProps) => {
  return (
    <div
      className={cn(
        'line-clamp-1 inline-flex w-max items-center rounded-md border px-1.5 py-0.5 text-xs font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
      )}
      style={getSelectOptionStrongStyle(color)}
    >
      {name}
    </div>
  );
};
