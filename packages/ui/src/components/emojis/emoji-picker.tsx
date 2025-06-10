import { useState } from 'react';

import { Emoji } from '@colanode/client/types';
import { EmojiBrowser } from '@colanode/ui/components/emojis/emoji-browser';
import { EmojiSearch } from '@colanode/ui/components/emojis/emoji-search';
import { EmojiSkinToneSelector } from '@colanode/ui/components/emojis/emoji-skin-tone-selector';
import { EmojiPickerContext } from '@colanode/ui/contexts/emoji-picker';

interface EmojiPickerProps {
  onPick: (emoji: Emoji, skinTone: number) => void;
}

export const EmojiPicker = ({ onPick }: EmojiPickerProps) => {
  const [query, setQuery] = useState('');
  const [skinTone, setSkinTone] = useState(0);

  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex flex-row items-center gap-1">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md bg-gray-100 p-2 text-xs focus:outline-none"
        />
        <EmojiSkinToneSelector
          skinTone={skinTone}
          onSkinToneChange={setSkinTone}
        />
      </div>
      <div className="h-[280px] min-h-[280px] overflow-auto w-[330px] min-w-[330px]">
        <EmojiPickerContext.Provider
          value={{
            skinTone,
            onPick: (emoji) => onPick(emoji, skinTone),
          }}
        >
          {query.length > 2 ? <EmojiSearch query={query} /> : <EmojiBrowser />}
        </EmojiPickerContext.Provider>
      </div>
    </div>
  );
};
