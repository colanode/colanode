import { eq, useLiveInfiniteQuery } from '@tanstack/react-db';
import { Fragment, useEffect, useRef } from 'react';
import { InView } from 'react-intersection-observer';

import { LocalMessageNode } from '@colanode/client/types';
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
        .from({ nodes: collections.workspace(workspace.userId).nodes })
        .where(({ nodes }) => eq(nodes.type, 'message'))
        .where(({ nodes }) => eq(nodes.parentId, conversation.id))
        .orderBy(({ nodes }) => nodes.id, 'desc'),
    {
      pageSize: MESSAGES_PER_PAGE,
      getNextPageParam: (lastPage) =>
        lastPage.length === MESSAGES_PER_PAGE ? lastPage.length : undefined,
    }
  );

  const messages =
    messageListQuery.data.map((node) => node as LocalMessageNode) ?? [];

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
      {(() => {
        const elements = [];
        for (let i = messages.length - 1; i >= 0; i--) {
          const message = messages[i];
          if (!message) continue;

          const previousMessage =
            i < messages.length - 1 ? messages[i + 1] : null;

          const currentMessageDate = new Date(message.createdAt);
          const previousMessageDate = previousMessage
            ? new Date(previousMessage.createdAt)
            : null;
          const showDate =
            !previousMessageDate ||
            currentMessageDate.getDate() !== previousMessageDate.getDate();

          elements.push(
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
        }
        return elements;
      })()}
    </Fragment>
  );
};
