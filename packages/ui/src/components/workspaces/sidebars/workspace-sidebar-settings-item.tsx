import {
  UnreadBadge,
  UnreadBadgeProps,
} from '@colanode/ui/components/ui/unread-badge';
import { cn } from '@colanode/ui/lib/utils';

interface WorkspaceSidebarSettingsItemProps {
  title: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  unreadBadge?: UnreadBadgeProps;
  isActive?: boolean;
}

export const WorkspaceSidebarSettingsItem = ({
  title,
  icon: Icon,
  unreadBadge,
  isActive,
}: WorkspaceSidebarSettingsItemProps) => {
  return (
    <div
      className={cn(
        'text-sm flex h-7 items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
        isActive &&
          'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
      )}
    >
      <Icon className="size-4" />
      <span className="line-clamp-1 w-full flex-grow text-left">{title}</span>
      {unreadBadge && (
        <UnreadBadge className="absolute top-0 right-0" {...unreadBadge} />
      )}
    </div>
  );
};
