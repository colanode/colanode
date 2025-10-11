import { User } from '@colanode/client/types/users';

export type UserListQueryInput = {
  type: 'user.list';
  userId: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'user.list': {
      input: UserListQueryInput;
      output: User[];
    };
  }
}
