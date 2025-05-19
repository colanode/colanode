import { AccountMetadata } from '@colanode/client/types/accounts';

export type AccountMetadataListQueryInput = {
  type: 'account_metadata_list';
  accountId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    account_metadata_list: {
      input: AccountMetadataListQueryInput;
      output: AccountMetadata[];
    };
  }
}
