import {
  UnreadBadge,
  UnreadBadgeProps,
} from '@colanode/ui/components/ui/unread-badge';
import { useLayout } from '@colanode/ui/contexts/layout';
import { cn } from '@colanode/ui/lib/utils';

interface SidebarSettingsItemProps {
  title: string;
  path: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  unreadBadge?: UnreadBadgeProps;
}

export const SidebarSettingsItem = ({
  title,
  icon: Icon,
  path,
  unreadBadge,
}: SidebarSettingsItemProps) => {
  const layout = useLayout();
  const isActive = layout.activeTab === path;

  return (
    <div
      className={cn(
        'text-sm flex h-7 items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
        isActive && 'font-semibold'
      )}
      onClick={() => {
        layout.previewLeft(path);
      }}
    >
      <Icon className="size-4" />
      <span className="line-clamp-1 w-full flex-grow text-left">{title}</span>
      {unreadBadge && (
        <UnreadBadge className="absolute top-0 right-0" {...unreadBadge} />
      )}
    </div>
  );
};
