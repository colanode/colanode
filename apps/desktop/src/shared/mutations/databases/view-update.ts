import { ViewAttributes } from '@colanode/core';

export type ViewUpdateMutationInput = {
  type: 'view_update';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  view: ViewAttributes;
};

export type ViewUpdateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    view_update: {
      input: ViewUpdateMutationInput;
      output: ViewUpdateMutationOutput;
    };
  }
}
