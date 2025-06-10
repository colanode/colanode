import { SmilePlus } from 'lucide-react';
import { useState } from 'react';

import { EmojiPicker } from '@colanode/ui/components/emojis/emoji-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';

interface MessageReactionProps {
  onReactionClick: (reaction: string) => void;
}

export const MessageReactionCreatePopover = ({
  onReactionClick,
}: MessageReactionProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger>
        <SmilePlus className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-max p-0" align="end">
        <EmojiPicker
          onPick={(emoji, skinTone) => {
            const id = emoji.skins[skinTone]?.id;
            if (!id) {
              return;
            }

            onReactionClick(id);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
