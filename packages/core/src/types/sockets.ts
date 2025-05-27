import { z } from 'zod';

import {
  SynchronizerInput,
  SynchronizerMap,
} from '@colanode/core/synchronizers';

export const socketInitOutputSchema = z.object({
  id: z.string(),
});

export type SocketInitOutput = z.infer<typeof socketInitOutputSchema>;

export type SynchronizerInputMessage = {
  type: 'synchronizer_input';
  id: string;
  userId: string;
  input: SynchronizerInput;
  cursor: string;
};

export type SynchronizerOutputMessage<TInput extends SynchronizerInput> = {
  type: 'synchronizer_output';
  userId: string;
  id: string;
  items: {
    cursor: string;
    data: SynchronizerMap[TInput['type']]['data'];
  }[];
};

export type AccountUpdatedMessage = {
  type: 'account_updated';
  accountId: string;
};

export type WorkspaceUpdatedMessage = {
  type: 'workspace_updated';
  workspaceId: string;
};

export type WorkspaceDeletedMessage = {
  type: 'workspace_deleted';
  accountId: string;
};

export type UserCreatedMessage = {
  type: 'user_created';
  accountId: string;
  workspaceId: string;
  userId: string;
};

export type UserUpdatedMessage = {
  type: 'user_updated';
  accountId: string;
  userId: string;
};

export type Message =
  | AccountUpdatedMessage
  | WorkspaceUpdatedMessage
  | WorkspaceDeletedMessage
  | UserCreatedMessage
  | UserUpdatedMessage
  | SynchronizerInputMessage
  | SynchronizerOutputMessage<SynchronizerInput>;
