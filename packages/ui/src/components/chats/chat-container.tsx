import { LocalChatNode } from '@colanode/client/types';
import { ChatNotFound } from '@colanode/ui/components/chats/chat-not-found';
import { NodeCollaboratorsPopover } from '@colanode/ui/components/collaborators/node-collaborators-popover';
import { ContainerBreadcrumb } from '@colanode/ui/components/layouts/containers/container-breadrumb';
import { Conversation } from '@colanode/ui/components/messages/conversation';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@colanode/ui/components/ui/container';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

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
