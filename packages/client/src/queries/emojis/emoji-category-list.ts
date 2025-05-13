import { EmojiCategory } from '../../types/emojis';

export type EmojiCategoryListQueryInput = {
  type: 'emoji_category_list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    emoji_category_list: {
      input: EmojiCategoryListQueryInput;
      output: EmojiCategory[];
    };
  }
}
