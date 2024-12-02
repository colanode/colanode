import { WorkspaceOutput } from '@colanode/core';

import { Account } from '@/shared/types/accounts';

export type EmailLoginMutationInput = {
  type: 'email_login';
  server: string;
  email: string;
  password: string;
};

export type EmailLoginMutationOutput =
  | EmailLoginMutationSuccessOutput
  | EmailLoginMutationErrorOutput;

export type EmailLoginMutationSuccessOutput = {
  success: true;
  account: Account;
  workspaces: WorkspaceOutput[];
};

export type EmailLoginMutationErrorOutput = {
  success: false;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    email_login: {
      input: EmailLoginMutationInput;
      output: EmailLoginMutationOutput;
    };
  }
}
