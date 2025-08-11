import { Avatar } from '@colanode/client/types/avatars';

export type AvatarGetQueryInput = {
  type: 'avatar.get';
  accountId: string;
  avatarId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'avatar.get': {
      input: AvatarGetQueryInput;
      output: Avatar | null;
    };
  }
}
