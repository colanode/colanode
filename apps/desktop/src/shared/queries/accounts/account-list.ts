import { Account } from '@/shared/types/accounts';

export type AccountListQueryInput = {
  type: 'account_list';
};

declare module '@/shared/queries' {
  interface QueryMap {
    account_list: {
      input: AccountListQueryInput;
      output: Account[];
    };
  }
}
