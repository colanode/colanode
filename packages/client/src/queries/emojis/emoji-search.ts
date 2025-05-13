import { Emoji } from '../../types/emojis';

export type EmojiSearchQueryInput = {
  type: 'emoji_search';
  query: string;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    emoji_search: {
      input: EmojiSearchQueryInput;
      output: Emoji[];
    };
  }
}
