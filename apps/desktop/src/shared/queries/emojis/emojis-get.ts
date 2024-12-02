import { EmojiData } from '@/shared/types/emojis';

export type EmojisGetQueryInput = {
  type: 'emojis_get';
};

declare module '@/shared/queries' {
  interface QueryMap {
    emojis_get: {
      input: EmojisGetQueryInput;
      output: EmojiData;
    };
  }
}
