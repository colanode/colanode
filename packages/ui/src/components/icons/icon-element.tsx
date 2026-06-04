import { ShieldQuestionMark } from 'lucide-react';

import { useApp } from '@colanode/ui/contexts/app';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { cn } from '@colanode/ui/lib/utils';

interface IconElementProps {
  id: string;
  className?: string;
}

const IconElementWeb = ({ id, className }: IconElementProps) => {
  return (
    <span
      className={cn(
        'icon-element inline-flex items-center justify-center',
        className
      )}
    >
      <svg fill="currentColor" viewBox="0 0 24 24">
        <use href={`/assets/icons.svg#${id}`} />
      </svg>
    </span>
  );
};

const IconElementDesktop = ({ id, className }: IconElementProps) => {
  const svgQuery = useQuery(
    {
      type: 'icon.svg.get',
      id,
    },
    {
      staleTime: Infinity,
    }
  );

  if (svgQuery.isLoading) {
    return null;
  }

  const svg = svgQuery.data;
  if (!svg) {
    return (
      <span
        className={cn(
          'icon-element inline-flex items-center justify-center',
          className
        )}
      >
        <ShieldQuestionMark />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'icon-element inline-flex items-center justify-center',
        className
      )}
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
