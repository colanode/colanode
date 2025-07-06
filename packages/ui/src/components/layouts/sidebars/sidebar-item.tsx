import { RefAttributes, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { LocalNode } from '@colanode/client/types';
import { ChannelSidebarItem } from '@colanode/ui/components/channels/channel-sidebar-item';
import { ChatSidebarItem } from '@colanode/ui/components/chats/chat-sidebar-item';
import { DatabaseSidebarItem } from '@colanode/ui/components/databases/database-sidiebar-item';
import { FolderSidebarItem } from '@colanode/ui/components/folders/folder-sidebar-item';
import { PageSidebarItem } from '@colanode/ui/components/pages/page-sidebar-item';
import { SpaceSidebarItem } from '@colanode/ui/components/spaces/space-sidebar-item';
import { cn } from '@colanode/ui/lib/utils';

interface SidebarItemContentProps {
  node: LocalNode;
}

export const SidebarItemContent = ({
  node,
}: SidebarItemContentProps): React.ReactNode => {
  switch (node.type) {
    case 'space':
      return <SpaceSidebarItem space={node} />;
    case 'channel':
      return <ChannelSidebarItem channel={node} />;
    case 'chat':
      return <ChatSidebarItem chat={node} />;
    case 'page':
      return <PageSidebarItem page={node} />;
    case 'database':
      return <DatabaseSidebarItem database={node} />;
    case 'folder':
      return <FolderSidebarItem folder={node} />;
    default:
      return null;
  }
};

interface SidebarItemProps {
  node: LocalNode;
  isActive: boolean;
  canDrag: boolean;
  onDragEnd: (after: string | null) => void;
}

export const SidebarItem = ({
  node,
  isActive,
  canDrag,
  onDragEnd,
}: SidebarItemProps): React.ReactNode => {
  const [, dragRef] = useDrag({
    type: 'sidebar-item',
    canDrag: () => canDrag,
    end: (_item, monitor) => {
      const dropResult = monitor.getDropResult<{ after: string | null }>();
      if (!dropResult) {
        return;
      }

      if (dropResult.after === node.id) {
        return;
      }

      onDragEnd(dropResult.after);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [dropMonitor, dropRef] = useDrop({
    accept: 'sidebar-item',
    drop: () => ({
      after: node.id,
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const divRef = useRef<HTMLDivElement>(null);
  const dragDropRef = dragRef(dropRef(divRef));

  return (
    <div
      className={cn(
        'text-sm flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
        isActive &&
          'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
        dropMonitor.isOver &&
          dropMonitor.canDrop &&
          'border-b-2 border-blue-300'
      )}
      ref={dragDropRef as RefAttributes<HTMLDivElement>['ref']}
    >
      <SidebarItemContent node={node} />
    </div>
  );
};
