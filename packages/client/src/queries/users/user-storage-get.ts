import { FileSubtype } from '@colanode/core';

export type UserStorageGetQueryInput = {
  type: 'user.storage.get';
  accountId: string;
  workspaceId: string;
};

export type UserStorageGetQueryOutput = {
  limit: string;
  used: string;
  subtypes: {
    subtype: FileSubtype;
    size: string;
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
