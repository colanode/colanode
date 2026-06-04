import { createContext, useContext } from 'react';

import { LocalMessageNode } from '@colanode/client/types';

interface MessageContext extends LocalMessageNode {
  canDelete: boolean;
  canEdit: boolean;
  canForward: boolean;
  canPin: boolean;
  canReplyInThread: boolean;
  isEditing: boolean;
  isPinned: boolean;
  openDelete: () => void;
  openEdit: () => void;
  closeEdit: () => void;
  openForward: () => void;
  togglePin: () => void;
}

export const MessageContext = createContext<MessageContext>(
  {} as MessageContext
);

export const useMessage = () => useContext(MessageContext);
