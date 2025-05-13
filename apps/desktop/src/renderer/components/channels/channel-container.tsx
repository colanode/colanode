import { LocalChannelNode } from '@colanode/client/types';

import { ChannelNotFound } from '@/renderer/components/channels/channel-not-found';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { useNodeContainer } from '@/renderer/hooks/use-node-container';
import { ChannelSettings } from '@/renderer/components/channels/channel-settings';
import { Conversation } from '@/renderer/components/messages/conversation';
import { useNodeRadar } from '@/renderer/hooks/use-node-radar';

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
