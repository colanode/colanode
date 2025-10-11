import { User } from '@colanode/client/types/users';

export type UserGetQueryInput = {
  type: 'user.get';
  id: string;
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'user.get': {
      input: UserGetQueryInput;
      output: User | null;
    };
  }
}
