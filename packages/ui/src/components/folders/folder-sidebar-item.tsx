import { LocalFolderNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { cn } from '@colanode/ui/lib/utils';

interface FolderSidebarItemProps {
  folder: LocalFolderNode;
  isActive: boolean;
}

export const FolderSidebarItem = ({
  folder,
  isActive,
}: FolderSidebarItemProps) => {
  const isUnread = false;
  const mentionsCount = 0;

  return (
    <button
      key={folder.id}
      className={cn(
        'flex w-full items-center cursor-pointer',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={folder.id}
        avatar={folder.avatar}
        name={folder.name}
        className="h-4 w-4"
      />
      <span
        className={cn(
          'line-clamp-1 w-full grow pl-2 text-left',
          isUnread && 'font-bold'
        )}
      >
        {folder.name ?? 'Unnamed'}
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
