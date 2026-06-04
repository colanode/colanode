import { eq, useLiveInfiniteQuery } from '@tanstack/react-db';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { InView } from 'react-intersection-observer';

import { LocalMessageNode } from '@colanode/client/types';
import { compareString } from '@colanode/core';
import { Message } from '@colanode/ui/components/messages/message';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

const MESSAGES_PER_PAGE = 50;

interface MessageListProps {
  searchQuery?: string;
  fromDate?: string;
  toDate?: string;
  threadRootMessageId?: string;
}

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDateDivider = (date: Date): string => {
  const now = new Date();
  if (isSameDay(date, now)) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 7 && diffDays >= 0) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const toStartOfDayIso = (date: string): string => {
  return new Date(`${date}T00:00:00`).toISOString();
};

const toEndOfDayIso = (date: string): string => {
  return new Date(`${date}T23:59:59.999`).toISOString();
};

export const MessageList = ({
  searchQuery = '',
  fromDate = '',
  toDate = '',
  threadRootMessageId,
}: MessageListProps) => {
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

  const trimmedSearchQuery = searchQuery.trim();
  const inThreadView = threadRootMessageId != null;
  const hasSearchFilters =
    !inThreadView &&
    (trimmedSearchQuery.length > 0 || fromDate.length > 0 || toDate.length > 0);

  const threadMessageQuery = useQuery(
    {
      type: 'message.search',
      userId: workspace.userId,
      conversationId: conversation.id,
      threadRootMessageId,
      limit: 500,
    },
    {
      enabled: inThreadView,
    }
  );

  const fromCreatedAt = fromDate.length > 0 ? toStartOfDayIso(fromDate) : undefined;
  const toCreatedAt = toDate.length > 0 ? toEndOfDayIso(toDate) : undefined;

  const messageSearchQuery = useQuery(
    {
      type: 'message.search',
      userId: workspace.userId,
      conversationId: conversation.id,
      searchQuery: trimmedSearchQuery,
      fromCreatedAt,
      toCreatedAt,
      limit: 500,
    },
    {
      enabled: hasSearchFilters,
    }
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

  const messages: LocalMessageNode[] = inThreadView
    ? (threadMessageQuery.data ?? [])
    : hasSearchFilters
      ? (messageSearchQuery.data ?? [])
      : messageListQuery.data
        .map((node) => node as LocalMessageNode)
        .toSorted((a, b) => compareString(a.id, b.id));

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) {
        return;
      }

      if (
        !hasSearchFilters &&
        !inThreadView &&
        lastMessage.id !== lastMessageId.current
      ) {
        lastMessageId.current = lastMessage.id;
        conversation.onLastMessageIdChange(lastMessage.id);
      }
    }
  }, [messages, hasSearchFilters, inThreadView]);

  return (
    <Fragment>
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (
            !inThreadView &&
            !hasSearchFilters &&
            inView &&
            messageListQuery.hasNextPage &&
            !messageListQuery.isFetchingNextPage
          ) {
            messageListQuery.fetchNextPage();
          }
        }}
      />
      {hasSearchFilters && (
        <div className="px-2 py-1 text-xs text-muted-foreground">
          {messageSearchQuery.isPending
            ? 'Searching...'
            : `${messages.length} result${messages.length === 1 ? '' : 's'}`}
        </div>
      )}
      {inThreadView && (
        <div className="px-2 py-1 text-xs text-muted-foreground">
          {threadMessageQuery.isPending
            ? 'Loading thread...'
            : `${Math.max(messages.length - 1, 0)} repl${messages.length - 1 === 1 ? 'y' : 'ies'
            } in thread`}
        </div>
      )}
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
          !hasSearchFilters &&
          unreadSnapshot > 0 &&
          messages.length >= unreadSnapshot &&
          index === messages.length - unreadSnapshot;

        return (
          <Fragment key={message.id}>
            {showDate && (
              <div className="relative flex items-center py-1">
                <div className="grow border-t border-muted" />
                <span className="mx-4 shrink text-xs text-muted-foreground">
                  {formatDateDivider(currentMessageDate)}
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
            {hasSearchFilters && (
              <div className="px-2 pb-1 pl-12 text-xs">
                <button
                  type="button"
                  className="cursor-pointer text-blue-600 hover:underline"
                  onClick={() => {
                    conversation.onLocateMessage(message.id);
                  }}
                >
                  Jump to message →
                </button>
              </div>
            )}
          </Fragment>
        );
      })}
    </Fragment>
  );
};
