import { LocalFolderNode } from '@colanode/client/types';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useLayout } from '@/renderer/contexts/layout';
import { cn } from '@/shared/lib/utils';

interface FolderSidebarItemProps {
  folder: LocalFolderNode;
}

export const FolderSidebarItem = ({ folder }: FolderSidebarItemProps) => {
  const layout = useLayout();
  const isActive = layout.activeTab === folder.id;
  const isUnread = false;
  const mentionsCount = 0;

  return (
    <button
      key={folder.id}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={folder.id}
        avatar={folder.attributes.avatar}
        name={folder.attributes.name}
        className="h-4 w-4"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          isUnread && 'font-bold'
        )}
      >
        {folder.attributes.name ?? 'Unnamed'}
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
