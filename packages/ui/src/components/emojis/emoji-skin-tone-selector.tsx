import React from 'react';
import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { defaultEmojis, getEmojiUrl } from '@colanode/ui/lib/assets';

interface EmojiSkinToneSelectorProps {
  skinTone: number;
  onSkinToneChange: (skinTone: number) => void;
}

export const EmojiSkinToneSelector = ({
  skinTone,
  onSkinToneChange,
}: EmojiSkinToneSelectorProps) => {
  const [open, setOpen] = React.useState<boolean>(false);

  const { data } = useQuery({
    type: 'emoji_get',
    id: defaultEmojis.hand,
  });

  const handleSkinToneSelection = (skinTone: number) => {
    setOpen(false);
    onSkinToneChange?.(skinTone);
  };

  if (!data) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-[32px] w-6 items-center justify-center p-1 hover:bg-gray-50 ${
            open && 'bg-gray-100'
          }`}
        >
          <img
            src={getEmojiUrl(data.skins[skinTone || 0]?.id)}
            className="h-full w-full"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-50">
        {data.skins.map((skin, idx) => (
          <button
            key={`skin-selector-${skin}`}
            className={`h-6 w-6 p-1 hover:bg-gray-100 ${
              idx === skinTone && 'bg-gray-100'
            }`}
            onClick={() => handleSkinToneSelection(idx)}
          >
            <EmojiElement id={skin.id} className="h-full w-full" alt="" />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
