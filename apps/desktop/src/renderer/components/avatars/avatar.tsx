import { getIdType, IdType } from '@colanode/core';

import { useAccount } from '@/renderer/contexts/account';
import {
  getAvatarSizeClasses,
  getAvatarUrl,
  getColorForId,
  getDefaultNodeAvatar,
} from '@/shared/lib/avatars';
import { getEmojiUrl } from '@/shared/lib/emojis';
import { getIconUrl } from '@/shared/lib/icons';
import { cn } from '@/shared/lib/utils';

interface AvatarProps {
  id: string;
  name?: string | null;
  avatar?: string | null;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  className?: string;
}

export const Avatar = (props: AvatarProps) => {
  const { avatar } = props;
  if (!avatar) {
    return <AvatarFallback {...props} />;
  }

  const avatarType = getIdType(avatar);
  if (avatarType === IdType.Emoji) {
    return <EmojiAvatar {...props} />;
  } else if (avatarType === IdType.Icon) {
    return <IconAvatar {...props} />;
  } else {
    return <CustomAvatar {...props} />;
  }
};

const AvatarFallback = ({ id, name, size, className }: AvatarProps) => {
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
      <div
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded text-white shadow',
          getAvatarSizeClasses(size),
          className
        )}
        style={{ backgroundColor: color }}
      >
        <span className="font-medium">{name[0]?.toLocaleUpperCase()}</span>
      </div>
    );
  }

  return null;
};

const EmojiAvatar = ({ avatar, size, className }: AvatarProps) => {
  if (!avatar) {
    return null;
  }

  const url = getEmojiUrl(avatar);
  return (
    <img
      src={url}
      className={cn(getAvatarSizeClasses(size), className)}
      alt={'Emoji'}
    />
  );
};

const IconAvatar = ({ avatar, size, className }: AvatarProps) => {
  if (!avatar) {
    return null;
  }

  const url = getIconUrl(avatar);
  return (
    <img
      src={url}
      className={cn(getAvatarSizeClasses(size), className)}
      alt={'Icon'}
    />
  );
};

const CustomAvatar = ({ avatar, size, className }: AvatarProps) => {
  const server = useAccount();

  if (!avatar) {
    return null;
  }

  const url = getAvatarUrl(server.id, avatar);
  return (
    <img
      src={url}
      className={cn(getAvatarSizeClasses(size), className)}
      alt={'Custom Avatar'}
    />
  );
};
