import { eq, useLiveInfiniteQuery } from '@tanstack/react-db';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { InView } from 'react-intersection-observer';

import { LocalMessageNode } from '@colanode/client/types';
import { compareString } from '@colanode/core';
import { Message } from '@colanode/ui/components/messages/message';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const MESSAGES_PER_PAGE = 50;

export const MessageList = () => {
  const workspace = useWorkspace();
  const conversation = useConversation();
  const radar = useRadar();

  const lastMessageId = useRef<string | null>(null);

  // 快照进入该会话时的未读数，新消息不会移动分隔线位置
  const unreadSnapshot = useMemo(
    () =>
      radar.getNodeState(workspace.userId, conversation.id).unreadCount,
    // 仅在切换会话时重新快照
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversation.id, workspace.userId]
  );
  const messageListQuery = useLiveInfiniteQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.type, 'message'))
        .where(({ nodes }) => eq(nodes.parentId, conversation.id))
        .orderBy(({ nodes }) => nodes.id, 'desc'),
    {
      pageSize: MESSAGES_PER_PAGE,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === MESSAGES_PER_PAGE ? allPages.length : undefined,
    },
    [workspace.userId, conversation.id]
  );

  const messages: LocalMessageNode[] = messageListQuery.data
    .map((node) => node as LocalMessageNode)
    .toSorted((a, b) => compareString(a.id, b.id));

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

        const showUnreadDivider =
          unreadSnapshot > 0 &&
          messages.length >= unreadSnapshot &&
          index === messages.length - unreadSnapshot;

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
            {showUnreadDivider && (
              <div className="relative flex items-center py-1">
                <div className="grow border-t border-red-500/60" />
                <span className="mx-3 shrink rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                  New
                </span>
                <div className="grow border-t border-red-500/60" />
              </div>
            )}
            <Message message={message} previousMessage={previousMessage} />
          </Fragment>
        );
      })}
    </Fragment>
  );
};
