import { useState } from 'react';

import { getIdType } from '@colanode/core';
import { AvatarFallback } from '@colanode/ui/components/avatars/avatar-fallback';
import { useAccount } from '@colanode/ui/contexts/account';
import { useQuery } from '@colanode/ui/hooks/use-query';
import {
  AvatarProps,
  getAvatarSizeClasses,
  getDefaultNodeAvatar,
} from '@colanode/ui/lib/avatars';
import { cn } from '@colanode/ui/lib/utils';

export const AvatarImage = ({ avatar, size, className }: AvatarProps) => {
  const account = useAccount();
  const [failed, setFailed] = useState(false);

  const { data, isPending } = useQuery(
    {
      type: 'avatar.url.get',
      accountId: account.id,
      avatarId: avatar!,
    },
    {
      enabled: !!avatar,
    }
  );

  if (!avatar) {
    return null;
  }

  const url = data?.url;
  if (failed || !url || isPending) {
    const avatarSize = size || 'medium';

    const idType = getIdType(avatar);
    const defaultAvatar = getDefaultNodeAvatar(idType);
    if (!defaultAvatar) {
      return <AvatarFallback id={avatar} name={account.name} size={avatarSize} className={className} />;
    }

    return <AvatarFallback id={avatar} size={avatarSize} className={className} />;
  }

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
