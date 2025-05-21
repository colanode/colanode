import React from 'react';

import { getIdType, IdType } from '@colanode/core';
import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { IconElement } from '@colanode/ui/components/icons/icon-element';
import { useApp } from '@colanode/ui/contexts';
import { useAccount } from '@colanode/ui/contexts/account';
import {
  getAvatarSizeClasses,
  getColorForId,
  getDefaultNodeAvatar,
} from '@colanode/ui/lib/avatars';
import { cn } from '@colanode/ui/lib/utils';

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
  if (avatarType === IdType.EmojiSkin) {
    return (
      <EmojiElement
        id={avatar}
        className={cn(getAvatarSizeClasses(props.size), props.className)}
      />
    );
  } else if (avatarType === IdType.Icon) {
    return (
      <IconElement
        id={avatar}
        className={cn(getAvatarSizeClasses(props.size), props.className)}
      />
    );
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

const CustomAvatar = ({ avatar, size, className }: AvatarProps) => {
  const app = useApp();
  const account = useAccount();
  const [failed, setFailed] = React.useState(false);

  if (!avatar) {
    return null;
  }

  if (failed) {
    return <AvatarFallback id={avatar} size={size} className={className} />;
  }

  const url =
    app.type === 'web'
      ? `/assets/avatars/${account.id}/${avatar}`
      : `avatar://${account.id}/${avatar}`;

  return (
    <img
      src={url}
      className={cn(
        getAvatarSizeClasses(size),
        'object-cover rounded',
        className
      )}
      alt={'Custom Avatar'}
      onError={() => setFailed(true)}
    />
  );
};
