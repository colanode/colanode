import { Account } from '@colanode/client/types/accounts';

export type AccountListQueryInput = {
  type: 'account.list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'account.list': {
      input: AccountListQueryInput;
      output: Account[];
    };
  }
}
