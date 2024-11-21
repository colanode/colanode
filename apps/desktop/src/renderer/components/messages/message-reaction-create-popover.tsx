import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { EmojiPicker } from '@/renderer/components/emojis/emoji-picker';
import { SmilePlus } from 'lucide-react';

interface MessageReactionProps {
  onReactionClick: (reaction: string) => void;
}

export const MessageReactionCreatePopover = ({
  onReactionClick,
}: MessageReactionProps) => {
  const [open, setOpen] = React.useState(false);

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
