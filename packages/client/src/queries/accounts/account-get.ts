import { Account } from '../../types/accounts';

export type AccountGetQueryInput = {
  type: 'account_get';
  accountId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    account_get: {
      input: AccountGetQueryInput;
      output: Account | null;
    };
  }
}
