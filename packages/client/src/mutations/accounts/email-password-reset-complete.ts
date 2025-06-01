export type EmailPasswordResetCompleteMutationInput = {
  type: 'email_password_reset_complete';
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
    email_password_reset_complete: {
      input: EmailPasswordResetCompleteMutationInput;
      output: EmailPasswordResetCompleteMutationOutput;
    };
  }
}
