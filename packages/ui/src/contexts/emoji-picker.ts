import { createContext, useContext } from 'react';

import { Emoji } from '@colanode/client/types';

interface EmojiPickerContextProps {
  skinTone: number;
  onPick: (emoji: Emoji) => void;
}

export const EmojiPickerContext = createContext<EmojiPickerContextProps>(
  {} as EmojiPickerContextProps
);

export const useEmojiPicker = () => useContext(EmojiPickerContext);
