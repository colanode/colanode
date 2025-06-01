export type EmailPasswordResetInitMutationInput = {
  type: 'email_password_reset_init';
  server: string;
  email: string;
};

export type EmailPasswordResetInitMutationOutput = {
  id: string;
  expiresAt: Date;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    email_password_reset_init: {
      input: EmailPasswordResetInitMutationInput;
      output: EmailPasswordResetInitMutationOutput;
    };
  }
}
