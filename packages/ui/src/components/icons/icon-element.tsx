import { useAsset } from '@colanode/ui/contexts/asset';

interface IconElementProps {
  id: string;
  className?: string;
}

export const IconElement = ({ id, className }: IconElementProps) => {
  const asset = useAsset();

  if (asset.iconComponent === 'svg') {
    return (
      <svg className={className}>
        <use href={asset.getIconUrl(id)} />
      </svg>
    );
  }

  return <img src={asset.getIconUrl(id)} className={className} />;
};
