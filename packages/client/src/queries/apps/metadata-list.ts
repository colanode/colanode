import { Metadata } from '@colanode/client/types/apps';

export type MetadataListQueryInput = {
  type: 'metadata.list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'metadata.list': {
      input: MetadataListQueryInput;
      output: Metadata[];
    };
  }
}
