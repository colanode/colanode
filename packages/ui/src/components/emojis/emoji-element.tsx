import { useApp } from '@colanode/ui/contexts/app';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface EmojiElementProps {
  id: string;
  className?: string;
  onClick?: () => void;
}

const EmojiElementWeb = ({ id, className, onClick }: EmojiElementProps) => {
  return (
    <svg className={className} onClick={onClick}>
      <use href={`/assets/emojis.svg#${id}`} />
    </svg>
  );
};

const EmojiElementDesktop = ({ id, className, onClick }: EmojiElementProps) => {
  const svgQuery = useLiveQuery({
    type: 'emoji.svg.get',
    id,
  });

  if (svgQuery.isLoading) {
    return null;
  }

  if (svgQuery.isError) {
    return null;
  }

  const svg = svgQuery.data;
  if (!svg) {
    return null;
  }

  return (
    <div
      className={className}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export const EmojiElement = ({ id, className, onClick }: EmojiElementProps) => {
  const app = useApp();

  if (app.type === 'web') {
    return <EmojiElementWeb id={id} className={className} onClick={onClick} />;
  }

  return (
    <EmojiElementDesktop id={id} className={className} onClick={onClick} />
  );
};
