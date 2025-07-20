import { CircleX } from 'lucide-react';

import { LocalMessageNode } from '@colanode/client/types';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface MessageReplyBannerProps {
  message: LocalMessageNode;
  onCancel: () => void;
}

export const MessageReplyBanner = ({
  message,
  onCancel,
}: MessageReplyBannerProps) => {
  const workspace = useWorkspace();
  const userGetQuery = useLiveQuery({
    type: 'user.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: message.createdBy,
  });

  if (userGetQuery.isPending || !userGetQuery.data) {
    return null;
  }

  return (
    <div className="flex flex-row items-center justify-between rounded-t-lg border-b-2 bg-gray-100 p-2 text-foreground">
      <p className="text-sm">
        Replying to{' '}
        <span className="font-semibold">{userGetQuery.data.name}</span>
      </p>
      <button className="cursor-pointer" onClick={onCancel}>
        <CircleX className="size-4" />
      </button>
    </div>
  );
};
