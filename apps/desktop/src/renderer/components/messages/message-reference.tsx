import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { MessageNode } from '@colanode/core';
import { MessageAuthorAvatar } from '@/renderer/components/messages/message-author-avatar';
import { MessageContent } from '@/renderer/components/messages/message-content';
import { MessageAuthorName } from '@/renderer/components/messages/message-author-name';

interface MessageReferenceProps {
  messageId: string;
}

export const MessageReference = ({ messageId }: MessageReferenceProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'node_get',
    nodeId: messageId,
    userId: workspace.userId,
  });

  if (!data || data.type !== 'message') {
    return null;
  }

  const message = data as MessageNode;

  return (
    <div className="flex flex-row gap-2 border-l-4 p-2">
      <MessageAuthorAvatar message={message} className="size-5 mt-1" />
      <div className='"flex-grow flex-col gap-1'>
        <MessageAuthorName message={message} />
        <MessageContent message={message} />
      </div>
    </div>
  );
};
