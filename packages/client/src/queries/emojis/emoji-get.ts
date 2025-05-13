import { Emoji } from '../../types/emojis';

export type EmojiGetQueryInput = {
  type: 'emoji_get';
  id: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    emoji_get: {
      input: EmojiGetQueryInput;
      output: Emoji;
    };
  }
}
