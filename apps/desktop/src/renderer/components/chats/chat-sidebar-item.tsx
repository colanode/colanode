import { ChatNode } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { ReadStateIndicator } from '@/renderer/components/layouts/read-state-indicator';
import { useRadar } from '@/renderer/contexts/radar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { cn } from '@/shared/lib/utils';

interface ChatSidebarItemProps {
  node: ChatNode;
}

export const ChatSidebarItem = ({ node }: ChatSidebarItemProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const collaboratorId =
    Object.keys(node.attributes.collaborators).find(
      (id) => id !== workspace.userId
    ) ?? '';

  const { data, isPending } = useQuery({
    type: 'node_get',
    nodeId: collaboratorId,
    userId: workspace.userId,
  });

  if (isPending || !data || data.type !== 'user') {
    return null;
  }

  const nodeReadState = radar.getChatState(workspace.userId, node.id);
  const isActive = workspace.isNodeActive(node.id);
  const unreadCount =
    nodeReadState.unseenMessagesCount + nodeReadState.mentionsCount;

  return (
    <div
      key={node.id}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={data.id}
        avatar={data.attributes.avatar}
        name={data.attributes.name}
        className="h-5 w-5"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          !isActive && unreadCount > 0 && 'font-semibold'
        )}
      >
        {data.attributes.name ?? 'Unnamed'}
      </span>
      {!isActive && (
        <ReadStateIndicator count={unreadCount} hasChanges={unreadCount > 0} />
      )}
    </div>
  );
};
