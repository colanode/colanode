import { LoginOutput } from '@colanode/core';

export type EmailVerifyMutationInput = {
  type: 'email.verify';
  server: string;
  id: string;
  otp: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'email.verify': {
      input: EmailVerifyMutationInput;
      output: LoginOutput;
    };
  }
}
