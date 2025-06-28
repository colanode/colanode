import { UnreadState } from '@colanode/client/types';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { cn } from '@colanode/ui/lib/utils';

interface SidebarMenuIconProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  isActive?: boolean;
  unreadState?: UnreadState;
}

export const SidebarMenuIcon = ({
  icon: Icon,
  onClick,
  isActive = false,
  unreadState,
}: SidebarMenuIconProps) => {
  return (
    <div
      className={cn(
        'w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-md relative',
        isActive ? 'bg-gray-200' : ''
      )}
      onClick={onClick}
    >
      <Icon
        className={cn(
          'size-5',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      />
      <UnreadBadge
        count={unreadState?.unreadCount ?? 0}
        unread={unreadState?.hasUnread ?? false}
        className="absolute top-0 right-0"
      />
    </div>
  );
};
