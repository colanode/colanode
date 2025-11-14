import { LoginOutput } from '@colanode/core';

export type GoogleLoginMutationInput = {
  type: 'google.login';
  server: string;
  code: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'google.login': {
      input: GoogleLoginMutationInput;
      output: LoginOutput;
    };
  }
}
