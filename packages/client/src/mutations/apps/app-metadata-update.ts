import { AppMetadataKey, AppMetadataMap } from '@colanode/client/types/apps';

export type AppMetadataUpdateMutationInput = {
  type: 'app.metadata.update';
  key: AppMetadataKey;
  value: AppMetadataMap[AppMetadataKey]['value'];
};

export type AppMetadataUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'app.metadata.update': {
      input: AppMetadataUpdateMutationInput;
      output: AppMetadataUpdateMutationOutput;
    };
  }
}
