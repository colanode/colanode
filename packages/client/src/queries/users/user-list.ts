import { User } from '@colanode/client/types/users';

export type UserListQueryInput = {
  type: 'user_list';
  accountId: string;
  workspaceId: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    user_list: {
      input: UserListQueryInput;
      output: User[];
    };
  }
}
