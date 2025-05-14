import { getColorForId } from '@colanode/ui/lib/avatars';
import { cn } from '@colanode/ui/lib/utils';

interface ServerAvatarProps {
  url: string | null;
  name: string;
  className?: string;
}

export const ServerAvatar = ({ url, name, className }: ServerAvatarProps) => {
  if (!url) {
    const color = getColorForId(name);
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded text-white shadow',
          className
        )}
        style={{ backgroundColor: color }}
      >
        <span className="font-medium">{name[0]?.toLocaleUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      className={cn('object-cover rounded', className)}
      alt={name}
    />
  );
};
