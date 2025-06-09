import { Emoji } from '@colanode/client/types/emojis';

export type EmojiGetQueryInput = {
  type: 'emoji.get';
  id: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'emoji.get': {
      input: EmojiGetQueryInput;
      output: Emoji | null;
    };
  }
}
