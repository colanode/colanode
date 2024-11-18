import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { MessageNode } from '@colanode/core';
import { CircleX } from 'lucide-react';

interface MessageReplyBannerProps {
  message: MessageNode;
  onCancel: () => void;
}

export const MessageReplyBanner = ({
  message,
  onCancel,
}: MessageReplyBannerProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'node_get',
    nodeId: message.createdBy,
    userId: workspace.userId,
  });

  if (!data || data.type !== 'user') {
    return null;
  }

  return (
    <div className="flex flex-row items-center justify-between rounded-t-lg border-b-2 bg-gray-100 p-2 text-foreground">
      <p className="text-sm">
        Replying to{' '}
        <span className="font-semibold">{data.attributes.name}</span>
      </p>
      <button className="cursor-pointer" onClick={onCancel}>
        <CircleX className="size-4" />
      </button>
    </div>
  );
};
