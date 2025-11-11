import { LocalChannelNode } from '@colanode/client/types';
import { ChannelNotFound } from '@colanode/ui/components/channels/channel-not-found';
import { ChannelSettings } from '@colanode/ui/components/channels/channel-settings';
import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { ContainerSettings } from '@colanode/ui/components/workspaces/containers/container-settings';
import { Conversation } from '@colanode/ui/components/messages/conversation';
import { NodeBreadcrumb } from '@colanode/ui/components/nodes/node-breadcrumb';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

interface ChannelContainerProps {
  channelId: string;
}

export const ChannelContainer = ({ channelId }: ChannelContainerProps) => {
  const data = useNodeContainer<LocalChannelNode>(channelId);

  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <ChannelNotFound />;
  }

  const { node: channel, role } = data;

  return (
    <>
      <Breadcrumb>
        <NodeBreadcrumb breadcrumb={data.breadcrumb} />
      </Breadcrumb>
      <ContainerSettings>
        <ChannelSettings channel={channel} role={role} />
      </ContainerSettings>
      <Conversation
        conversationId={channel.id}
        rootId={channel.rootId}
        role={role}
      />
    </>
  );
};
