import { LocalPageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { cn } from '@colanode/ui/lib/utils';

interface PageSidebarItemProps {
  page: LocalPageNode;
  isActive: boolean;
}

export const PageSidebarItem = ({ page, isActive }: PageSidebarItemProps) => {
  const isUnread = false;
  const mentionsCount = 0;

  return (
    <button
      key={page.id}
      className={cn(
        'flex w-full items-center cursor-pointer',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={page.id}
        avatar={page.avatar}
        name={page.name}
        className="h-4 w-4"
      />
      <span
        className={cn(
          'line-clamp-1 w-full grow pl-2 text-left',
          isUnread && 'font-bold'
        )}
      >
        {page.name ?? 'Unnamed'}
      </span>
      {mentionsCount > 0 && (
        <span className="mr-1 rounded-md bg-sidebar-accent px-1 py-0.5 text-xs text-sidebar-accent-foreground">
          {mentionsCount}
        </span>
      )}
      {mentionsCount == 0 && isUnread && (
        <span className="size-2 rounded-full bg-red-500" />
      )}
    </button>
  );
};
