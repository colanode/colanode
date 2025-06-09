import { EmojiCategory } from '@colanode/client/types/emojis';

export type EmojiCategoryListQueryInput = {
  type: 'emoji.category.list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'emoji.category.list': {
      input: EmojiCategoryListQueryInput;
      output: EmojiCategory[];
    };
  }
}
