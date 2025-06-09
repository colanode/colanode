import { LoginOutput } from '@colanode/core';

export type EmailLoginMutationInput = {
  type: 'email.login';
  server: string;
  email: string;
  password: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'email.login': {
      input: EmailLoginMutationInput;
      output: LoginOutput;
    };
  }
}
