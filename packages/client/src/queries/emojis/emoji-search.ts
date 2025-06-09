import { Emoji } from '@colanode/client/types/emojis';

export type EmojiSearchQueryInput = {
  type: 'emoji.search';
  query: string;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'emoji.search': {
      input: EmojiSearchQueryInput;
      output: Emoji[];
    };
  }
}
