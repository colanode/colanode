import { LoginOutput } from '@colanode/core';

export type EmailLoginMutationInput = {
  type: 'email_login';
  server: string;
  email: string;
  password: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    email_login: {
      input: EmailLoginMutationInput;
      output: LoginOutput;
    };
  }
}
