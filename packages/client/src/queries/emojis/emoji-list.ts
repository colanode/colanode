import { Emoji } from '../../types/emojis';

export type EmojiListQueryInput = {
  type: 'emoji_list';
  category: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    emoji_list: {
      input: EmojiListQueryInput;
      output: Emoji[];
    };
  }
}
