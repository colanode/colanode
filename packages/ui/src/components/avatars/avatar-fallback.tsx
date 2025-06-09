import { getIdType } from '@colanode/core';
import {
  getColorForId,
  getDefaultNodeAvatar,
  getAvatarSizeClasses,
  AvatarSize,
} from '@colanode/ui/lib/avatars';
import { cn } from '@colanode/ui/lib/utils';

import { Avatar } from './avatar';

interface AvatarFallbackProps {
  id: string;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
}

export const AvatarFallback = ({
  id,
  name,
  size,
  className,
}: AvatarFallbackProps) => {
  const idType = getIdType(id);
  const defaultAvatar = getDefaultNodeAvatar(idType);
  if (defaultAvatar) {
    return (
      <Avatar
        id={id}
        name={name}
        avatar={defaultAvatar}
        size={size}
        className={className}
      />
    );
  }

  if (name) {
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
        <span className="font-medium">{name[0]?.toLocaleUpperCase()}</span>
      </span>
    );
  }

  return null;
};
