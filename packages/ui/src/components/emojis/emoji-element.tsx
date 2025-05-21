import { useApp } from '@colanode/ui/contexts';

interface EmojiElementProps {
  id: string;
  className?: string;
  onClick?: () => void;
}

export const EmojiElement = ({ id, className, onClick }: EmojiElementProps) => {
  const app = useApp();

  if (app.type === 'web') {
    return (
      <svg className={className} onClick={onClick}>
        <use href={`/assets/emojis.svg#${id}`} />
      </svg>
    );
  }

  return (
    <img src={`asset://emojis/${id}`} className={className} onClick={onClick} />
  );
};
