import { LocalDatabaseViewNode } from '@colanode/client/types';
import { ViewIcon } from '@colanode/ui/components/databases/view-icon';
import { Link } from '@colanode/ui/components/ui/link';
import { cn } from '@colanode/ui/lib/utils';

interface DatabaseViewSidebarItemProps {
  view: LocalDatabaseViewNode;
}

export const DatabaseViewSidebarItem = ({
  view,
}: DatabaseViewSidebarItemProps) => {
  return (
    <Link from="/workspace/$userId" to="$nodeId" params={{ nodeId: view.id }}>
      {({ isActive }) => (
        <div
          className={cn(
            'text-sm flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
            isActive &&
              'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          )}
        >
          <ViewIcon
            id={view.id}
            name={view.name}
            avatar={view.avatar}
            layout={view.layout}
            className="size-4"
          />
          <span className="line-clamp-1 w-full grow text-left">
            {view.name ?? 'Unnamed View'}
          </span>
        </div>
      )}
    </Link>
  );
};
