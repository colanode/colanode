import { ShieldQuestionMark } from 'lucide-react';

import { useApp } from '@colanode/ui/contexts/app';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { cn } from '@colanode/ui/lib/utils';

interface IconElementProps {
  id: string;
  className?: string;
}

const IconElementWeb = ({ id, className }: IconElementProps) => {
  return (
    <div className={cn('icon-element', className)}>
      <svg>
        <use href={`/assets/icons.svg#${id}`} />
      </svg>
    </div>
  );
};

const IconElementDesktop = ({ id, className }: IconElementProps) => {
  const svgQuery = useLiveQuery({
    type: 'icon.svg.get',
    id,
  });

  if (svgQuery.isLoading) {
    return null;
  }

  const svg = svgQuery.data;
  if (!svg) {
    return (
      <div className={cn('icon-element', className)}>
        <ShieldQuestionMark />
      </div>
    );
  }

  return (
    <div
      className={cn('icon-element', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export const IconElement = ({ id, className }: IconElementProps) => {
  const app = useApp();

  if (app.type === 'web') {
    return <IconElementWeb id={id} className={className} />;
  }

  return <IconElementDesktop id={id} className={className} />;
};
