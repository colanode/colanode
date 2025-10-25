import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalChannelNode } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface ChannelContainerTabProps {
  channelId: string;
  isActive: boolean;
}

export const ChannelContainerTab = ({
  channelId,
  isActive,
}: ChannelContainerTabProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const nodeQuery = useLiveQuery((q) =>
    q
      .from({ nodes: collections.workspace(workspace.userId).nodes })
      .where(({ nodes }) => eq(nodes.id, channelId))
      .findOne()
  );

  const channel = nodeQuery.data as LocalChannelNode;
  if (!channel) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const name =
    channel.attributes.name && channel.attributes.name.length > 0
      ? channel.attributes.name
      : 'Unnamed';

  const unreadState = radar.getNodeState(workspace.userId, channel.id);

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={channel.id}
        name={name}
        avatar={channel.attributes.avatar}
      />
      <span>{name}</span>
      {!isActive && (
        <UnreadBadge
          count={unreadState.unreadCount}
          unread={unreadState.hasUnread}
        />
      )}
    </div>
  );
};
