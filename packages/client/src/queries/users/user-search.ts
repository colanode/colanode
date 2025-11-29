import { User } from '@colanode/client/types/users';

export type UserSearchQueryInput = {
  type: 'user.search';
  searchQuery: string;
  userId: string;
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
