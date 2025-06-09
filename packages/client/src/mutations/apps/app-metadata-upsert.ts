import { AppMetadataKey, AppMetadataMap } from '@colanode/client/types/apps';

export type AppMetadataUpsertMutationInput = {
  type: 'app.metadata.upsert';
  key: AppMetadataKey;
  value: AppMetadataMap[AppMetadataKey]['value'];
};

export type AppMetadataUpsertMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'app.metadata.upsert': {
      input: AppMetadataUpsertMutationInput;
      output: AppMetadataUpsertMutationOutput;
    };
  }
}
