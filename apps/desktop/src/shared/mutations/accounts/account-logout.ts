export type AccountLogoutMutationInput = {
  type: 'account_logout';
  accountId: string;
};

export type AccountLogoutMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    account_logout: {
      input: AccountLogoutMutationInput;
      output: AccountLogoutMutationOutput;
    };
  }
}
