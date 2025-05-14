import { LocalChannelNode } from '@colanode/client/types';
import { ChannelNotFound } from '@colanode/ui/components/channels/channel-not-found';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@colanode/ui/components/ui/container';
import { ContainerBreadcrumb } from '@colanode/ui/components/layouts/containers/container-breadrumb';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { ChannelSettings } from '@colanode/ui/components/channels/channel-settings';
import { Conversation } from '@colanode/ui/components/messages/conversation';
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
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <ChannelSettings channel={channel} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <Conversation
          conversationId={channel.id}
          rootId={channel.rootId}
          role={role}
        />
      </ContainerBody>
    </Container>
  );
};
