export type AccountUpdateMutationInput = {
  type: 'account_update';
  id: string;
  name: string;
  avatar: string | null | undefined;
};

export type AccountUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    account_update: {
      input: AccountUpdateMutationInput;
      output: AccountUpdateMutationOutput;
    };
  }
}
