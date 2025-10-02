import {
  UnreadBadge,
  UnreadBadgeProps,
} from '@colanode/ui/components/ui/unread-badge';
import { cn } from '@colanode/ui/lib/utils';

interface SidebarMenuIconProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  isActive?: boolean;
  unreadBadge?: UnreadBadgeProps;
  className?: string;
}

export const SidebarMenuIcon = ({
  icon: Icon,
  onClick,
  isActive = false,
  unreadBadge,
  className,
}: SidebarMenuIconProps) => {
  return (
    <div
      className={cn(
        'w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md relative',
        className,
        isActive ? 'bg-gray-200 dark:bg-gray-800' : ''
      )}
      onClick={onClick}
    >
      <Icon
        className={cn(
          'size-5',
          isActive ? 'text-foreground' : 'text-muted-foreground'
        )}
      />
      {unreadBadge && (
        <UnreadBadge
          {...unreadBadge}
          className={cn('absolute top-0 right-0', unreadBadge.className)}
        />
      )}
    </div>
  );
};
