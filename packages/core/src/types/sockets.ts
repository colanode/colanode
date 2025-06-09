import { z } from 'zod/v4';

import {
  SynchronizerInput,
  SynchronizerMap,
} from '@colanode/core/synchronizers';

export const socketInitOutputSchema = z.object({
  id: z.string(),
});

export type SocketInitOutput = z.infer<typeof socketInitOutputSchema>;

export type SynchronizerInputMessage = {
  type: 'synchronizer.input';
  id: string;
  userId: string;
  input: SynchronizerInput;
  cursor: string;
};

export type SynchronizerOutputMessage<TInput extends SynchronizerInput> = {
  type: 'synchronizer.output';
  userId: string;
  id: string;
  items: {
    cursor: string;
    data: SynchronizerMap[TInput['type']]['data'];
  }[];
};

export type AccountUpdatedMessage = {
  type: 'account.updated';
  accountId: string;
};

export type WorkspaceUpdatedMessage = {
  type: 'workspace.updated';
  workspaceId: string;
};

export type WorkspaceDeletedMessage = {
  type: 'workspace.deleted';
  accountId: string;
};

export type UserCreatedMessage = {
  type: 'user.created';
  accountId: string;
  workspaceId: string;
  userId: string;
};

export type UserUpdatedMessage = {
  type: 'user.updated';
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
