import { EntryRole } from '@colanode/core';
import { createContext, useContext } from 'react';

import { MessageNode } from '@/shared/types/messages';

interface ConversationContext {
  id: string;
  rootId: string;
  role: EntryRole;
  canCreateMessage: boolean;
  onReply: (message: MessageNode) => void;
  onLastMessageIdChange: (id: string) => void;
  canDeleteMessage: (message: MessageNode) => boolean;
}

export const ConversationContext = createContext<ConversationContext>(
  {} as ConversationContext
);

export const useConversation = () => useContext(ConversationContext);
