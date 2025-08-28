import { useState } from 'react';

import { AvatarFallback } from '@colanode/ui/components/avatars/avatar-fallback';
import { useAccount } from '@colanode/ui/contexts/account';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { AvatarProps, getAvatarSizeClasses } from '@colanode/ui/lib/avatars';
import { cn } from '@colanode/ui/lib/utils';

export const AvatarImage = (props: AvatarProps) => {
  const account = useAccount();
  const [failed, setFailed] = useState(false);

  const avatarQuery = useLiveQuery({
    type: 'avatar.get',
    accountId: account.id,
    avatarId: props.avatar!,
  });

  if (avatarQuery.isPending) {
    return (
      <div
        className={cn(
          getAvatarSizeClasses(props.size),
          'object-cover rounded bg-muted',
          props.className
        )}
      />
    );
  }

  const avatar = avatarQuery.data;
  if (!avatar || failed) {
    return <AvatarFallback {...props} />;
  }

  return (
    <img
      src={avatar.url}
      className={cn(
        getAvatarSizeClasses(props.size),
        'object-cover rounded',
        props.className
      )}
      alt={'Custom Avatar'}
      onError={() => setFailed(true)}
    />
  );
};
