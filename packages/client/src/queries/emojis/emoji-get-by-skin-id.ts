import { Emoji } from '@colanode/client/types/emojis';

export type EmojiGetBySkinIdQueryInput = {
  type: 'emoji_get_by_skin_id';
  id: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    emoji_get_by_skin_id: {
      input: EmojiGetBySkinIdQueryInput;
      output: Emoji | null;
    };
  }
}
