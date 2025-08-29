import { ShieldQuestionMark } from 'lucide-react';

import { useApp } from '@colanode/ui/contexts/app';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { cn } from '@colanode/ui/lib/utils';

interface EmojiElementProps {
  id: string;
  className?: string;
  onClick?: () => void;
}

const EmojiElementWeb = ({ id, className, onClick }: EmojiElementProps) => {
  return (
    <div className={cn('emoji-element', className)} onClick={onClick}>
      <svg>
        <use href={`/assets/emojis.svg#${id}`} />
      </svg>
    </div>
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

  const svg = svgQuery.data;
  if (!svg) {
    return (
      <div className={cn('emoji-element', className)} onClick={onClick}>
        <ShieldQuestionMark />
      </div>
    );
  }

  return (
    <div
      className={cn('emoji-element', className)}
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
