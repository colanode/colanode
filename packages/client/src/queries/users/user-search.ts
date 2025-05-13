import { User } from '../../types/users';

export type UserSearchQueryInput = {
  type: 'user_search';
  searchQuery: string;
  accountId: string;
  workspaceId: string;
  exclude?: string[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    user_search: {
      input: UserSearchQueryInput;
      output: User[];
    };
  }
}
