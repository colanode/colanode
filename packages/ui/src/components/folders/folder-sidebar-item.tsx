import { LocalFolderNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Link } from '@colanode/ui/components/ui/link';
import { cn } from '@colanode/ui/lib/utils';

interface FolderSidebarItemProps {
  folder: LocalFolderNode;
}

export const FolderSidebarItem = ({ folder }: FolderSidebarItemProps) => {
  return (
    <Link from="/workspace/$userId" to="$nodeId" params={{ nodeId: folder.id }}>
      {({ isActive }) => (
        <div
          className={cn(
            'text-sm flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
            isActive &&
              'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          )}
        >
          <Avatar
            id={folder.id}
            avatar={folder.avatar}
            name={folder.name}
            className="size-4 shrink-0"
          />
          <span className="line-clamp-1 w-full grow text-left">
            {folder.name ?? 'Unnamed'}
          </span>
        </div>
      )}
    </Link>
  );
};
