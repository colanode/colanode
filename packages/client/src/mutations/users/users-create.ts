import {
  UserCreateErrorOutput,
  UserCreateInput,
  UserOutput,
} from '@colanode/core';

export type UsersCreateMutationInput = {
  type: 'users.create';
  workspaceId: string;
  accountId: string;
  users: UserCreateInput[];
};

export type UsersCreateMutationOutput = {
  users: UserOutput[];
  errors: UserCreateErrorOutput[];
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'users.create': {
      input: UsersCreateMutationInput;
      output: UsersCreateMutationOutput;
    };
  }
}
