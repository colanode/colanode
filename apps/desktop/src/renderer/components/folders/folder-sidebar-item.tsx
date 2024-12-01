import { FolderNode } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { cn } from '@/shared/lib/utils';

interface FolderSidebarItemProps {
  node: FolderNode;
}

export const FolderSidebarItem = ({ node }: FolderSidebarItemProps) => {
  const workspace = useWorkspace();
  const isActive = workspace.isNodeActive(node.id);
  const isUnread = false;
  const mentionsCount = 0;

  return (
    <button
      key={node.id}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={node.id}
        avatar={node.attributes.avatar}
        name={node.attributes.name}
        className="h-4 w-4"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          isUnread && 'font-bold'
        )}
      >
        {node.attributes.name ?? 'Unnamed'}
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
