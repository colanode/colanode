import { createContext, useContext } from 'react';

import { LocalMessageNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';

interface ConversationContext {
  id: string;
  rootId: string;
  role: NodeRole;
  canCreateMessage: boolean;
  searchTerms: string[];
  flashMessageId: string | null;
  onReply: (message: LocalMessageNode) => void;
  onReplyInThread: (message: LocalMessageNode) => void;
  onLastMessageIdChange: (id: string) => void;
  onLocateMessage: (messageId: string) => void;
  canDeleteMessage: (message: LocalMessageNode) => boolean;
}

export const ConversationContext = createContext<ConversationContext>(
  {} as ConversationContext
);

export const useConversation = () => useContext(ConversationContext);
