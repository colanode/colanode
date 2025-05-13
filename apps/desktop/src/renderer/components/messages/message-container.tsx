import { LocalMessageNode } from '@colanode/client/types';

import { MessageNotFound } from '@/renderer/components/messages/message-not-found';
import {
  Container,
  ContainerBody,
  ContainerHeader,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { useNodeContainer } from '@/renderer/hooks/use-node-container';
import { useNodeRadar } from '@/renderer/hooks/use-node-radar';
import { Message } from '@/renderer/components/messages/message';
import { ConversationContext } from '@/renderer/contexts/conversation';

interface MessageContainerProps {
  messageId: string;
}

export const MessageContainer = ({ messageId }: MessageContainerProps) => {
  const data = useNodeContainer<LocalMessageNode>(messageId);

  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <MessageNotFound />;
  }

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
      </ContainerHeader>
      <ContainerBody>
        <ConversationContext.Provider
          value={{
            id: data.node.id,
            role: data.role,
            rootId: data.node.rootId,
            canCreateMessage: true,
            onReply: () => {},
            onLastMessageIdChange: () => {},
            canDeleteMessage: () => false,
          }}
        >
          <Message message={data.node} />
        </ConversationContext.Provider>
      </ContainerBody>
    </Container>
  );
};
