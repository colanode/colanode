import { Account } from '@/shared/types/accounts';

export type AccountGetQueryInput = {
  type: 'account_get';
  accountId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    account_get: {
      input: AccountGetQueryInput;
      output: Account | null;
    };
  }
}
