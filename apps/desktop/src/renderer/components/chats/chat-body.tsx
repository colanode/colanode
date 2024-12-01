import { ChatNode, NodeRole } from '@colanode/core';

import { Conversation } from '@/renderer/components/messages/conversation';

interface ChatBodyProps {
  chat: ChatNode;
  role: NodeRole;
}

export const ChatBody = ({ chat, role }: ChatBodyProps) => {
  return <Conversation conversationId={chat.id} role={role} />;
};
