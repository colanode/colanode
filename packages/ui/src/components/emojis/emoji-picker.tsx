import { useState } from 'react';

import { Emoji } from '@colanode/client/types';
import { EmojiBrowser } from '@colanode/ui/components/emojis/emoji-browser';
import { EmojiSearch } from '@colanode/ui/components/emojis/emoji-search';
import { EmojiSkinToneSelector } from '@colanode/ui/components/emojis/emoji-skin-tone-selector';
import { Input } from '@colanode/ui/components/ui/input';
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
        <Input
          type="text"
          placeholder="Search emojis..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <EmojiSkinToneSelector
          skinTone={skinTone}
          onSkinToneChange={setSkinTone}
        />
      </div>
      <div className="h-[280px] min-h-[280px] w-[330px] min-w-[330px]">
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
