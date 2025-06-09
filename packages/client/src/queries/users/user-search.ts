import { User } from '@colanode/client/types/users';

export type UserSearchQueryInput = {
  type: 'user.search';
  searchQuery: string;
  accountId: string;
  workspaceId: string;
  exclude?: string[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'user.search': {
      input: UserSearchQueryInput;
      output: User[];
    };
  }
}
