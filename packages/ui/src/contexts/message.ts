import { createContext, useContext } from 'react';

import { LocalMessageNode } from '@colanode/client/types';

interface MessageContext extends LocalMessageNode {
  canDelete: boolean;
  canReplyInThread: boolean;
  openDelete: () => void;
}

export const MessageContext = createContext<MessageContext>(
  {} as MessageContext
);

export const useMessage = () => useContext(MessageContext);
