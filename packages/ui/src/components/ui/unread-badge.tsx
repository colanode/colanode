import { cn } from '@colanode/ui/lib/utils';

interface UnreadBadgeProps {
  count: number;
  unread: boolean;
  className?: string;
}

export const UnreadBadge = ({ count, unread, className }: UnreadBadgeProps) => {
  if (count === 0 && !unread) {
    return null;
  }

  if (count > 0) {
    return (
      <span
        className={cn(
          'mr-1 rounded-md px-1 py-0.5 text-xs bg-red-400 text-white',
          className
        )}
      >
        {count}
      </span>
    );
  }

  return <span className={cn('size-2 rounded-full bg-red-500', className)} />;
};
