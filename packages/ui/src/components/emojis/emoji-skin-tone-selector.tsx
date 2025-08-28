import { useState } from 'react';

import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { defaultEmojis } from '@colanode/ui/lib/assets';

interface EmojiSkinToneSelectorProps {
  skinTone: number;
  onSkinToneChange: (skinTone: number) => void;
}

export const EmojiSkinToneSelector = ({
  skinTone,
  onSkinToneChange,
}: EmojiSkinToneSelectorProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const emojiGetQuery = useLiveQuery({
    type: 'emoji.get',
    id: defaultEmojis.hand,
  });

  const handleSkinToneSelection = (skinTone: number) => {
    setOpen(false);
    onSkinToneChange?.(skinTone);
  };

  if (emojiGetQuery.isPending || !emojiGetQuery.data) {
    return null;
  }

  const emoji = emojiGetQuery.data;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline" className="p-2">
          <EmojiElement
            id={emoji.skins[skinTone || 0]?.id ?? ''}
            className="h-full w-full"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-row gap-1 p-1 w-60">
        {emoji.skins.map((skin, idx) => (
          <Button
            key={`skin-selector-${skin.id}`}
            size="icon"
            variant="ghost"
            onClick={() => handleSkinToneSelection(idx)}
            className="size-8 p-1"
          >
            <EmojiElement id={skin.id} className="h-full w-full" />
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
