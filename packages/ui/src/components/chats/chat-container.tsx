import { LocalChatNode } from '@colanode/client/types';
import { ChatNotFound } from '@colanode/ui/components/chats/chat-not-found';
import { Conversation } from '@colanode/ui/components/messages/conversation';
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
    <Conversation conversationId={node.id} rootId={node.rootId} role={role} />
  );
};
