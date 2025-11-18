import { LocalMessageNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { Message } from '@colanode/ui/components/messages/message';
import { ConversationContext } from '@colanode/ui/contexts/conversation';

interface MessageContainerProps {
  message: LocalMessageNode;
  role: NodeRole;
}

export const MessageContainer = ({ message, role }: MessageContainerProps) => {
  return (
    <ConversationContext.Provider
      value={{
        id: message.id,
        role: role,
        rootId: message.rootId,
        canCreateMessage: true,
        onReply: () => {},
        onLastMessageIdChange: () => {},
        canDeleteMessage: () => false,
      }}
    >
      <Message message={message} />
    </ConversationContext.Provider>
  );
};
