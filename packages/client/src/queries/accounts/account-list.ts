import { Account } from '../../types/accounts';

export type AccountListQueryInput = {
  type: 'account_list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    account_list: {
      input: AccountListQueryInput;
      output: Account[];
    };
  }
}
