import { AppMetadata } from '@colanode/client/types/apps';

export type AppMetadataListQueryInput = {
  type: 'app_metadata_list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    app_metadata_list: {
      input: AppMetadataListQueryInput;
      output: AppMetadata[];
    };
  }
}
