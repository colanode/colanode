import { useAsset } from '@colanode/ui/contexts/asset';

interface EmojiElementProps {
  id: string;
  className?: string;
  onClick?: () => void;
}

export const EmojiElement = ({ id, className, onClick }: EmojiElementProps) => {
  const asset = useAsset();

  if (asset.emojiComponent === 'svg') {
    return (
      <svg className={className} onClick={onClick}>
        <use href={asset.getEmojiUrl(id)} />
      </svg>
    );
  }

  return (
    <img src={asset.getEmojiUrl(id)} className={className} onClick={onClick} />
  );
};
