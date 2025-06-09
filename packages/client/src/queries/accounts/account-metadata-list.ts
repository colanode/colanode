import { AccountMetadata } from '@colanode/client/types/accounts';

export type AccountMetadataListQueryInput = {
  type: 'account.metadata.list';
  accountId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'account.metadata.list': {
      input: AccountMetadataListQueryInput;
      output: AccountMetadata[];
    };
  }
}
