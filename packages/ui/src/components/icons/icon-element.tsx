import { useApp } from '@colanode/ui/contexts/app';

interface IconElementProps {
  id: string;
  className?: string;
}

export const IconElement = ({ id, className }: IconElementProps) => {
  const app = useApp();

  if (app.type === 'web') {
    return (
      <svg className={className}>
        <use href={`/assets/icons.svg#${id}`} />
      </svg>
    );
  }

  return <img src={`local://icons/${id}`} className={className} />;
};
