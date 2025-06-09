import { Account } from '@colanode/client/types/accounts';

export type AccountGetQueryInput = {
  type: 'account.get';
  accountId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'account.get': {
      input: AccountGetQueryInput;
      output: Account | null;
    };
  }
}
