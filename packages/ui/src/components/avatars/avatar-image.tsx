import { useState } from 'react';

import { AvatarFallback } from '@colanode/ui/components/avatars/avatar-fallback';
import { useAccount } from '@colanode/ui/contexts/account';
import { useApp } from '@colanode/ui/contexts/app';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { AvatarProps, getAvatarSizeClasses } from '@colanode/ui/lib/avatars';
import { cn } from '@colanode/ui/lib/utils';

export const AvatarImageWeb = (props: AvatarProps) => {
  const account = useAccount();
  const [failed, setFailed] = useState(false);

  const { data, isPending } = useLiveQuery(
    {
      type: 'avatar.url.get',
      accountId: account.id,
      avatarId: props.avatar!,
    },
    {
      enabled: !!props.avatar,
    }
  );

  const url = data?.url;
  if (failed || !url || isPending) {
    return <AvatarFallback {...props} />;
  }

  return (
    <img
      src={url}
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

const AvatarImageDesktop = (props: AvatarProps) => {
  const account = useAccount();
  const url = `local://avatars/${account.id}/${props.avatar}`;
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <AvatarFallback {...props} />;
  }

  return (
    <img
      src={url}
      className={cn(getAvatarSizeClasses(props.size), 'object-cover rounded')}
      alt={'Custom Avatar'}
      onError={() => setFailed(true)}
    />
  );
};

export const AvatarImage = (props: AvatarProps) => {
  const app = useApp();

  if (app.type === 'web') {
    return <AvatarImageWeb {...props} />;
  }

  return <AvatarImageDesktop {...props} />;
};
