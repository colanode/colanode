import {
  getColorForId,
  getAvatarSizeClasses,
  AvatarProps,
} from '@colanode/ui/lib/avatars';
import { cn } from '@colanode/ui/lib/utils';

export const AvatarFallback = (props: AvatarProps) => {
  const { id, name, size, className } = props;

  const char = name?.[0]?.toLocaleUpperCase() || '?';
  const color = getColorForId(id);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded text-white shadow',
        getAvatarSizeClasses(size),
        className
      )}
      style={{ backgroundColor: color }}
    >
      <span className="font-medium">{char}</span>
    </span>
  );
};
