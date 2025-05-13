import { LoginOutput } from '@colanode/core';

export type EmailVerifyMutationInput = {
  type: 'email_verify';
  server: string;
  id: string;
  otp: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    email_verify: {
      input: EmailVerifyMutationInput;
      output: LoginOutput;
    };
  }
}
