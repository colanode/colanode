import { NodeRole } from '@colanode/core';
import { createContext, useContext } from 'react';
import { LocalMessageNode } from '@colanode/client/types';

interface ConversationContext {
  id: string;
  rootId: string;
  role: NodeRole;
  canCreateMessage: boolean;
  onReply: (message: LocalMessageNode) => void;
  onLastMessageIdChange: (id: string) => void;
  canDeleteMessage: (message: LocalMessageNode) => boolean;
}

export const ConversationContext = createContext<ConversationContext>(
  {} as ConversationContext
);

export const useConversation = () => useContext(ConversationContext);
