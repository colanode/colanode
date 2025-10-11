import { eq, useLiveQuery } from '@tanstack/react-db';
import { CircleX } from 'lucide-react';

import { LocalMessageNode } from '@colanode/client/types';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

interface MessageReplyBannerProps {
  message: LocalMessageNode;
  onCancel: () => void;
}

export const MessageReplyBanner = ({
  message,
  onCancel,
}: MessageReplyBannerProps) => {
  const workspace = useWorkspace();
  const userQuery = useLiveQuery((q) =>
    q
      .from({ users: database.workspace(workspace.userId).users })
      .where(({ users }) => eq(users.id, message.createdBy))
      .select(({ users }) => ({
        id: users.id,
        name: users.name,
      }))
      .findOne()
  );

  const user = userQuery.data;
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-row items-center justify-between rounded-t-lg border-b-2 bg-muted p-2 text-foreground">
      <p className="text-sm">
        Replying to <span className="font-semibold">{user.name}</span>
      </p>
      <button className="cursor-pointer" onClick={onCancel}>
        <CircleX className="size-4" />
      </button>
    </div>
  );
};
