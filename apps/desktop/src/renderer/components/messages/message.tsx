import { InView } from 'react-intersection-observer';
import { MessageNode } from '@colanode/core';
import { MessageReactions } from '@/renderer/components/messages/message-reactions';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useRadar } from '@/renderer/contexts/radar';
import { MessageActions } from '@/renderer/components/messages/message-actions';
import { MessageAvatar } from '@/renderer/components/messages/message-avatar';
import { MessageHeader } from '@/renderer/components/messages/message-header';
import { MessageContent } from '@/renderer/components/messages/message-content';

interface MessageProps {
  message: MessageNode;
  previousMessage?: MessageNode | null;
}

const shouldDisplayAuthor = (
  message: MessageNode,
  previousMessage?: MessageNode | null
) => {
  if (!previousMessage) {
    return true;
  }

  const previousMessageDate = new Date(previousMessage.createdAt);
  const currentMessageDate = new Date(message.createdAt);

  if (previousMessageDate.getDate() !== currentMessageDate.getDate()) {
    return true;
  }

  return previousMessage.createdBy !== message.createdBy;
};

export const Message = ({ message, previousMessage }: MessageProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();
  const displayAuthor = shouldDisplayAuthor(message, previousMessage);

  return (
    <div
      id={`message-${message.id}`}
      key={`message-${message.id}`}
      className={`group flex flex-row px-1 hover:bg-gray-50 ${
        displayAuthor ? 'mt-2 first:mt-0' : ''
      }`}
    >
      <div className="mr-2 w-10 pt-1">
        {displayAuthor && <MessageAvatar message={message} />}
      </div>

      <div className="relative w-full">
        {displayAuthor && <MessageHeader message={message} />}
        <InView
          rootMargin="50px"
          onChange={(inView) => {
            if (inView) {
              radar.markAsSeen(workspace.userId, message.id, message.versionId);
            }
          }}
        >
          <MessageActions message={message} />
          <MessageContent message={message} />
          <MessageReactions message={message} />
        </InView>
      </div>
    </div>
  );
};
