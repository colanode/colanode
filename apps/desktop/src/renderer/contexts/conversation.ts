import { NodeRole } from '@colanode/core';
import { createContext, useContext } from 'react';
import { MessageNode } from '@colanode/core';

interface ConversationContext {
  id: string;
  role: NodeRole;
  canCreateMessage: boolean;
  onReply: (message: MessageNode) => void;
  onLastMessageIdChange: (id: string) => void;
  canDeleteMessage: (message: MessageNode) => boolean;
}

export const ConversationContext = createContext<ConversationContext>(
  {} as ConversationContext
);

export const useConversation = () => useContext(ConversationContext);
