import { getIdType, IdType } from '@colanode/core';
import { AvatarFallback } from '@colanode/ui/components/avatars/avatar-fallback';
import { AvatarImage } from '@colanode/ui/components/avatars/avatar-image';
import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { IconElement } from '@colanode/ui/components/icons/icon-element';
import {
  AvatarProps,
  getAvatarSizeClasses,
  getDefaultNodeAvatar,
} from '@colanode/ui/lib/avatars';
import { cn } from '@colanode/ui/lib/utils';

export const Avatar = (props: AvatarProps) => {
  let avatar = props.avatar;

  if (!avatar || avatar === '') {
    const idType = getIdType(props.id);
    const defaultAvatar = getDefaultNodeAvatar(idType);
    avatar = defaultAvatar;
  }

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
  }

  if (avatarType === IdType.Icon) {
    return (
      <IconElement
        id={avatar}
        className={cn(getAvatarSizeClasses(props.size), props.className)}
      />
    );
  }

  if (avatarType === IdType.Avatar) {
    return <AvatarImage {...props} />;
  }

  return <AvatarFallback {...props} />;
};
