import { UserNode } from '@colanode/core';

export type UserSearchQueryInput = {
  type: 'user_search';
  searchQuery: string;
  userId: string;
  exclude?: string[];
};

declare module '@/shared/queries' {
  interface QueryMap {
    user_search: {
      input: UserSearchQueryInput;
      output: UserNode[];
    };
  }
}
