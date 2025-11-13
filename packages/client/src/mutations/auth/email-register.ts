import { LoginOutput } from '@colanode/core';

export type EmailRegisterMutationInput = {
  type: 'email.register';
  server: string;
  name: string;
  email: string;
  password: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'email.register': {
      input: EmailRegisterMutationInput;
      output: LoginOutput;
    };
  }
}
