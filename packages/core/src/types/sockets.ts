import { SynchronizerInput, SynchronizerMap } from '../synchronizers';

export type SynchronizerInputMessage = {
  type: 'synchronizer_input';
  userId: string;
  id: string;
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

export type Message =
  | AccountUpdatedMessage
  | WorkspaceUpdatedMessage
  | WorkspaceDeletedMessage
  | SynchronizerInputMessage
  | SynchronizerOutputMessage<SynchronizerInput>;