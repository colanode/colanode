import { useApp } from '@colanode/ui/contexts/app';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface IconElementProps {
  id: string;
  className?: string;
}

const IconElementWeb = ({ id, className }: IconElementProps) => {
  return (
    <svg className={className}>
      <use href={`/assets/icons.svg#${id}`} />
    </svg>
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

  if (svgQuery.isError) {
    return null;
  }

  const svg = svgQuery.data;
  if (!svg) {
    return null;
  }

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />
  );
};

export const IconElement = ({ id, className }: IconElementProps) => {
  const app = useApp();

  if (app.type === 'web') {
    return <IconElementWeb id={id} className={className} />;
  }

  return <IconElementDesktop id={id} className={className} />;
};
