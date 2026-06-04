import { ShieldQuestionMark } from 'lucide-react';

import { useApp } from '@colanode/ui/contexts/app';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { cn } from '@colanode/ui/lib/utils';

interface EmojiElementProps {
  id: string;
  className?: string;
  onClick?: () => void;
}

const EmojiElementWeb = ({ id, className, onClick }: EmojiElementProps) => {
  return (
    <span
      className={cn(
        'emoji-element inline-flex items-center justify-center',
        className
      )}
      onClick={onClick}
    >
      <svg>
        <use href={`/assets/emojis.svg#${id}`} />
      </svg>
    </span>
  );
};

const EmojiElementDesktop = ({ id, className, onClick }: EmojiElementProps) => {
  const svgQuery = useQuery({
    type: 'emoji.svg.get',
    id,
  });

  if (svgQuery.isLoading) {
    return null;
  }

  const svg = svgQuery.data;
  if (!svg) {
    return (
      <span
        className={cn(
          'emoji-element inline-flex items-center justify-center',
          className
        )}
        onClick={onClick}
      >
        <ShieldQuestionMark />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'emoji-element inline-flex items-center justify-center',
        className
      )}
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
