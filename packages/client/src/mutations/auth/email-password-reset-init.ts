export type EmailPasswordResetInitMutationInput = {
  type: 'email.password.reset.init';
  server: string;
  email: string;
};

export type EmailPasswordResetInitMutationOutput = {
  id: string;
  expiresAt: Date;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'email.password.reset.init': {
      input: EmailPasswordResetInitMutationInput;
      output: EmailPasswordResetInitMutationOutput;
    };
  }
}
