export type EmailPasswordResetCompleteMutationInput = {
  type: 'email.password.reset.complete';
  server: string;
  id: string;
  otp: string;
  password: string;
};

export type EmailPasswordResetCompleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'email.password.reset.complete': {
      input: EmailPasswordResetCompleteMutationInput;
      output: EmailPasswordResetCompleteMutationOutput;
    };
  }
}
