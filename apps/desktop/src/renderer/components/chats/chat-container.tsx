import { LocalChatNode } from '@colanode/client/types';

import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { ChatNotFound } from '@/renderer/components/chats/chat-not-found';
import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { Conversation } from '@/renderer/components/messages/conversation';
import { useNodeRadar } from '@/renderer/hooks/use-node-radar';
import { useNodeContainer } from '@/renderer/hooks/use-node-container';

interface ChatContainerProps {
  chatId: string;
}

export const ChatContainer = ({ chatId }: ChatContainerProps) => {
  const data = useNodeContainer<LocalChatNode>(chatId);

  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <ChatNotFound />;
  }

  const { node, role } = data;

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <NodeCollaboratorsPopover node={node} nodes={[node]} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <Conversation
          conversationId={node.id}
          rootId={node.rootId}
          role={role}
        />
      </ContainerBody>
    </Container>
  );
};
