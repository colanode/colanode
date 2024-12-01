import { ChannelNode } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { ReadStateIndicator } from '@/renderer/components/layouts/read-state-indicator';
import { useRadar } from '@/renderer/contexts/radar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { cn } from '@/shared/lib/utils';

interface ChannelSidebarItemProps {
  node: ChannelNode;
}

export const ChannelSidebarItem = ({ node }: ChannelSidebarItemProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const isActive = workspace.isNodeActive(node.id);
  const channelState = radar.getChannelState(workspace.userId, node.id);
  const unreadCount = channelState.unseenMessagesCount;
  const mentionsCount = channelState.mentionsCount;

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
          !isActive && unreadCount > 0 && 'font-semibold'
        )}
      >
        {node.attributes.name ?? 'Unnamed'}
      </span>
      {!isActive && (
        <ReadStateIndicator
          count={mentionsCount}
          hasChanges={unreadCount > 0}
        />
      )}
    </button>
  );
};
