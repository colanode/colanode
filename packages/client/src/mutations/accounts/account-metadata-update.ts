import {
  AccountMetadataKey,
  AccountMetadataMap,
} from '@colanode/client/types/accounts';

export type AccountMetadataUpdateMutationInput = {
  type: 'account.metadata.update';
  accountId: string;
  key: AccountMetadataKey;
  value: AccountMetadataMap[AccountMetadataKey]['value'];
};

export type AccountMetadataUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'account.metadata.update': {
      input: AccountMetadataUpdateMutationInput;
      output: AccountMetadataUpdateMutationOutput;
    };
  }
}
