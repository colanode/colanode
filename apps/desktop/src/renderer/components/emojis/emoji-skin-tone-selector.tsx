import React from 'react';

import { EmojiElement } from '@/renderer/components/emojis/emoji-element';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { getEmojiUrl } from '@/shared/lib/emojis';

const skins: string[] = [
  '01je8kh1j8qdp2tbc4b8b8rgj7em',
  '01je8kh1j8qdp2tbc4b8b8rgj8em',
  '01je8kh1j8qdp2tbc4b8b8rgj9em',
  '01je8kh1j8qdp2tbc4b8b8rgjaem',
  '01je8kh1j8qdp2tbc4b8b8rgjbem',
  '01je8kh1j9q3pjaxx25w2ysct2em',
];

interface EmojiSkinToneSelectorProps {
  skinTone: number;
  onSkinToneChange: (skinTone: number) => void;
}

export const EmojiSkinToneSelector = ({
  skinTone,
  onSkinToneChange,
}: EmojiSkinToneSelectorProps) => {
  const [open, setOpen] = React.useState<boolean>(false);

  const handleSkinToneSelection = (skinTone: number) => {
    setOpen(false);
    onSkinToneChange?.(skinTone);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-[32px] w-6 items-center justify-center p-1 hover:bg-gray-50 ${
            open && 'bg-gray-100'
          }`}
        >
          <img
            src={getEmojiUrl(skins[skinTone || 0])}
            className="h-full w-full"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-50">
        {skins.map((skin, idx) => (
          <button
            key={`skin-selector-${skin}`}
            className={`h-6 w-6 p-1 hover:bg-gray-100 ${
              idx === skinTone && 'bg-gray-100'
            }`}
            onClick={() => handleSkinToneSelection(idx)}
          >
            <EmojiElement id={skin} className="h-full w-full" alt="" />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
