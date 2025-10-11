import { FileSubtype } from '@colanode/core';

export type UserStorageGetQueryInput = {
  type: 'user.storage.get';
  userId: string;
};

export type UserStorageGetQueryOutput = {
  storageLimit: string;
  storageUsed: string;
  subtypes: {
    subtype: FileSubtype;
    storageUsed: string;
  }[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'user.storage.get': {
      input: UserStorageGetQueryInput;
      output: UserStorageGetQueryOutput;
    };
  }
}
