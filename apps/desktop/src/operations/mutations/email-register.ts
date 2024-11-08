import { Account } from '@/types/accounts';
import { WorkspaceOutput } from '@/types/workspaces';

export type EmailRegisterMutationInput = {
  type: 'email_register';
  server: string;
  name: string;
  email: string;
  password: string;
};

export type EmailRegisterMutationOutput =
  | EmailRegisterMutationSuccessOutput
  | EmailRegisterMutationErrorOutput;

export type EmailRegisterMutationSuccessOutput = {
  success: true;
  account: Account;
  workspaces: WorkspaceOutput[];
};

export type EmailRegisterMutationErrorOutput = {
  success: false;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    email_register: {
      input: EmailRegisterMutationInput;
      output: EmailRegisterMutationOutput;
    };
  }
}