import { Fragment, useEffect, useRef, useState } from 'react';
import { InView } from 'react-intersection-observer';

import { MessageListQueryInput } from '@colanode/client/queries';
import { compareString } from '@colanode/core';
import { Message } from '@colanode/ui/components/messages/message';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQueries } from '@colanode/ui/hooks/use-live-queries';

const MESSAGES_PER_PAGE = 50;

export const MessageList = () => {
  const workspace = useWorkspace();
  const conversation = useConversation();

  const lastMessageId = useRef<string | null>(null);
  const [lastPage, setLastPage] = useState<number>(1);

  const inputs: MessageListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'message.list',
    conversationId: conversation.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    page: i + 1,
    count: MESSAGES_PER_PAGE,
  }));

  const result = useLiveQueries(inputs);
  const messages = result
    .flatMap((data) => data.data ?? [])
    .sort((a, b) => compareString(a.id, b.id));

  const isPending = result.some((data) => data.isPending);

  const hasMore =
    !isPending && messages.length === lastPage * MESSAGES_PER_PAGE;

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) {
        return;
      }

      if (lastMessage.id !== lastMessageId.current) {
        lastMessageId.current = lastMessage.id;
        conversation.onLastMessageIdChange(lastMessage.id);
      }
    }
  }, [messages]);

  return (
    <Fragment>
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (inView && hasMore && !isPending) {
            setLastPage(lastPage + 1);
          }
        }}
      />
      {messages.map((message, index) => {
        const previousMessage = index > 0 ? messages[index - 1] : null;

        const currentMessageDate = new Date(message.createdAt);
        const previousMessageDate = previousMessage
          ? new Date(previousMessage.createdAt)
          : null;
        const showDate =
          !previousMessageDate ||
          currentMessageDate.getDate() !== previousMessageDate.getDate();

        return (
          <Fragment key={message.id}>
            {showDate && (
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-muted" />
                <span className="mx-4 flex-shrink text-xs text-muted-foreground">
                  {currentMessageDate.toDateString()}
                </span>
                <div className="flex-grow border-t border-muted" />
              </div>
            )}
            <Message message={message} previousMessage={previousMessage} />
          </Fragment>
        );
      })}
    </Fragment>
  );
};
