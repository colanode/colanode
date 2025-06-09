import { AppMetadata } from '@colanode/client/types/apps';

export type AppMetadataListQueryInput = {
  type: 'app.metadata.list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'app.metadata.list': {
      input: AppMetadataListQueryInput;
      output: AppMetadata[];
    };
  }
}
