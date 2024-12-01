import { MessageNode } from '@colanode/core';
import { InView } from 'react-intersection-observer';

import { MessageActions } from '@/renderer/components/messages/message-actions';
import { MessageAuthorAvatar } from '@/renderer/components/messages/message-author-avatar';
import { MessageAuthorName } from '@/renderer/components/messages/message-author-name';
import { MessageContent } from '@/renderer/components/messages/message-content';
import { MessageReactions } from '@/renderer/components/messages/message-reactions';
import { MessageReference } from '@/renderer/components/messages/message-reference';
import { MessageTime } from '@/renderer/components/messages/message-time';
import { useRadar } from '@/renderer/contexts/radar';
import { useWorkspace } from '@/renderer/contexts/workspace';

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
        {displayAuthor && <MessageAuthorAvatar message={message} />}
      </div>

      <div className="relative w-full">
        {displayAuthor && (
          <div className="flex flex-row items-center gap-0.5">
            <MessageAuthorName message={message} />
            <MessageTime message={message} />
          </div>
        )}
        <InView
          rootMargin="50px"
          onChange={(inView) => {
            if (inView) {
              radar.markAsSeen(
                workspace.userId,
                message.id,
                message.transactionId
              );
            }
          }}
        >
          <MessageActions message={message} />
          {message.attributes.subtype === 'reply' && (
            <MessageReference messageId={message.attributes.referenceId} />
          )}
          <MessageContent message={message} />
          <MessageReactions message={message} />
        </InView>
      </div>
    </div>
  );
};
