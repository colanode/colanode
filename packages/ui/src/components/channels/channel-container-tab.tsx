import { LocalChannelNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

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

  const nodeGetQuery = useQuery({
    type: 'node.get',
    nodeId: channelId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (nodeGetQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const channel = nodeGetQuery.data as LocalChannelNode;
  if (!channel) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const name =
    channel.attributes.name && channel.attributes.name.length > 0
      ? channel.attributes.name
      : 'Unnamed';

  const unreadState = radar.getNodeState(
    workspace.accountId,
    workspace.id,
    channel.id
  );

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
