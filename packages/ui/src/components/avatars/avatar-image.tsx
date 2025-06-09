import { useState } from 'react';

import { AvatarFallback } from '@colanode/ui/components/avatars/avatar-fallback';
import { useAccount } from '@colanode/ui/contexts';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { AvatarProps, getAvatarSizeClasses } from '@colanode/ui/lib/avatars';
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
    return <AvatarFallback id={avatar} size={size} className={className} />;
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
