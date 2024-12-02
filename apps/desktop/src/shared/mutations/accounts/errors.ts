export type AccountNotFoundError = {
  type: 'account_not_found';
  message: string;
};

declare module '@/shared/mutations' {
  interface MutationErrorMap {
    account_not_found: AccountNotFoundError;
  }
}
