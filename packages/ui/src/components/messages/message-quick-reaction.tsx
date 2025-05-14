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
  const { data } = useQuery({
    type: 'emoji_get',
    id: emoji,
  });

  const skinId = data?.skins[0]?.id;
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
