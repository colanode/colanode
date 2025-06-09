import {
  AccountMetadataKey,
  AccountMetadataMap,
} from '@colanode/client/types/accounts';

export type AccountMetadataUpsertMutationInput = {
  type: 'account.metadata.upsert';
  accountId: string;
  key: AccountMetadataKey;
  value: AccountMetadataMap[AccountMetadataKey]['value'];
};

export type AccountMetadataUpsertMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'account.metadata.upsert': {
      input: AccountMetadataUpsertMutationInput;
      output: AccountMetadataUpsertMutationOutput;
    };
  }
}
