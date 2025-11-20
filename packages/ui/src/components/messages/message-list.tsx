import { eq, useLiveInfiniteQuery } from '@tanstack/react-db';
import { Fragment, useEffect, useRef } from 'react';
import { InView } from 'react-intersection-observer';

import { compareString } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { Message } from '@colanode/ui/components/messages/message';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const MESSAGES_PER_PAGE = 50;

export const MessageList = () => {
  const workspace = useWorkspace();
  const conversation = useConversation();

  const lastMessageId = useRef<string | null>(null);
  const messageListQuery = useLiveInfiniteQuery(
    (q) =>
      q
        .from({ messages: collections.workspace(workspace.userId).messages })
        .where(({ messages }) =>
          eq(messages.attributes.parentId, conversation.id)
        )
        .orderBy(({ messages }) => messages.id, 'desc'),
    {
      pageSize: MESSAGES_PER_PAGE,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === MESSAGES_PER_PAGE ? allPages.length : undefined,
    },
    [workspace.userId, conversation.id]
  );

  const messages = messageListQuery.data.toSorted((a, b) =>
    compareString(a.id, b.id)
  );

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
          if (
            inView &&
            messageListQuery.hasNextPage &&
            !messageListQuery.isFetchingNextPage
          ) {
            messageListQuery.fetchNextPage();
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
                <div className="grow border-t border-muted" />
                <span className="mx-4 shrink text-xs text-muted-foreground">
                  {currentMessageDate.toDateString()}
                </span>
                <div className="grow border-t border-muted" />
              </div>
            )}
            <Message message={message} previousMessage={previousMessage} />
          </Fragment>
        );
      })}
    </Fragment>
  );
};
