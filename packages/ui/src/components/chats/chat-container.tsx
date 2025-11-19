import { LocalChatNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { Conversation } from '@colanode/ui/components/messages/conversation';

interface ChatContainerProps {
  node: LocalChatNode;
  role: NodeRole;
}

export const ChatContainer = ({ node, role }: ChatContainerProps) => {
  return (
    <Conversation conversationId={node.id} rootId={node.rootId} role={role} />
  );
};
