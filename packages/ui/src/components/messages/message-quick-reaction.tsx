import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface MessageQuickReactionProps {
  emoji: string;
  onClick: (skinId: string) => void;
}

export const MessageQuickReaction = ({
  emoji,
  onClick,
}: MessageQuickReactionProps) => {
  const emojiGetQuery = useQuery({
    type: 'emoji.get',
    id: emoji,
  });

  const skinId = emojiGetQuery.data?.skins[0]?.id;
  if (!skinId) {
    return null;
  }

  return (
    <EmojiElement
      id={skinId}
      className="size-4"
      onClick={() => onClick(skinId)}
    />
  );
};
