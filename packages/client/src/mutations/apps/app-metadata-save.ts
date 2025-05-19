import { AppMetadataKey, AppMetadataMap } from '@colanode/client/types/apps';

export type AppMetadataSaveMutationInput = {
  type: 'app_metadata_save';
  key: AppMetadataKey;
  value: AppMetadataMap[AppMetadataKey]['value'];
};

export type AppMetadataSaveMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    app_metadata_save: {
      input: AppMetadataSaveMutationInput;
      output: AppMetadataSaveMutationOutput;
    };
  }
}
