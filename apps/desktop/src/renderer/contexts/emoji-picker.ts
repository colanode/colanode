import { createContext, useContext } from 'react';

import { Emoji,EmojiData } from '@/shared/types/emojis';

interface EmojiPickerContextProps {
  data: EmojiData;
  skinTone: number;
  onPick: (emoji: Emoji) => void;
}

export const EmojiPickerContext = createContext<EmojiPickerContextProps>(
  {} as EmojiPickerContextProps
);

export const useEmojiPicker = () => useContext(EmojiPickerContext);
