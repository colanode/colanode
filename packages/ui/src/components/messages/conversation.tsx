import { ArrowDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { InView } from 'react-intersection-observer';

import { LocalMessageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import {
  MessageCreate,
  MessageCreateRefProps,
} from '@colanode/ui/components/messages/message-create';
import { MessageList } from '@colanode/ui/components/messages/message-list';
import { Input } from '@colanode/ui/components/ui/input';
import { useContainer } from '@colanode/ui/contexts/container';
import { ConversationContext } from '@colanode/ui/contexts/conversation';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface ConversationProps {
  conversationId: string;
  rootId: string;
  role: NodeRole;
}

export const Conversation = ({
  conversationId,
  rootId,
  role,
}: ConversationProps) => {
  const workspace = useWorkspace();
  const container = useContainer();

  const scrollAreaRef = container.scrollAreaRef;
  const messageListRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomVisibleRef = useRef<boolean>(false);
  const shouldScrollToBottomRef = useRef<boolean>(true);
  const messageCreateRef = useRef<MessageCreateRefProps>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [threadRootMessage, setThreadRootMessage] =
    useState<LocalMessageNode | null>(null);

  const updateAtBottom = (atBottom: boolean) => {
    if (isAtBottomRef.current === atBottom) {
      return;
    }
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  };

  useEffect(() => {
    if (bottomRef.current && scrollPositionRef.current == 0) {
      bottomRef.current.scrollIntoView();
    }

    if (messageListRef.current && scrollAreaRef.current) {
      // observe resize of container when new messages are appended or internal elements are loaded (e.g. images)
      observerRef.current = new ResizeObserver(() => {
        if (scrollAreaRef.current) {
          if (shouldScrollToBottomRef.current) {
            bottomRef.current?.scrollIntoView();
          } else {
            scrollAreaRef.current.scrollTop =
              scrollAreaRef.current.scrollHeight - scrollPositionRef.current;
          }
        }
      });

      observerRef.current.observe(messageListRef.current);
      scrollAreaRef.current.addEventListener('scroll', handleScroll);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }

        if (scrollAreaRef.current) {
          scrollAreaRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    }

    return () => { };
  }, [conversationId]);

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      scrollPositionRef.current =
        scrollAreaRef.current.scrollHeight - scrollAreaRef.current.scrollTop;

      shouldScrollToBottomRef.current = bottomVisibleRef.current;

      const distanceFromBottom =
        scrollAreaRef.current.scrollHeight -
        scrollAreaRef.current.scrollTop -
        scrollAreaRef.current.clientHeight;
      updateAtBottom(distanceFromBottom < 80);
    }
  };

  const isAdmin = hasNodeRole(role, 'admin');
  const canCreateMessage = hasNodeRole(role, 'collaborator');

  return (
    <ConversationContext.Provider
      value={{
        id: conversationId,
        role,
        rootId,
        canCreateMessage,
        onReply: (message) => {
          if (messageCreateRef.current) {
            messageCreateRef.current.setReplyTo(message);
          }
        },
        onReplyInThread: (message) => {
          setThreadRootMessage(message);
          if (messageCreateRef.current) {
            messageCreateRef.current.setReplyTo(message);
          }
        },
        onLastMessageIdChange: () => {
          if (shouldScrollToBottomRef.current && bottomRef.current) {
            bottomRef.current.scrollIntoView();
          }
        },
        canDeleteMessage: (message) => {
          return isAdmin || message.createdBy === workspace.userId;
        },
      }}
    >
      <div className="relative flex flex-col h-full">
        {threadRootMessage ? (
          <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-2 py-2 backdrop-blur">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-8 rounded border border-border px-2 text-xs text-muted-foreground hover:bg-accent"
                onClick={() => {
                  setThreadRootMessage(null);
                }}
              >
                Back to channel
              </button>
              <span className="text-xs text-muted-foreground">
                Thread view
              </span>
            </div>
          </div>
        ) : (
          <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-2 py-2 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search messages"
                className="h-8 min-w-52 flex-1"
              />
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-8 w-40"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-8 w-40"
              />
              {(searchQuery.length > 0 ||
                fromDate.length > 0 ||
                toDate.length > 0) && (
                  <button
                    type="button"
                    className="h-8 rounded border border-border px-2 text-xs text-muted-foreground hover:bg-accent"
                    onClick={() => {
                      setSearchQuery('');
                      setFromDate('');
                      setToDate('');
                    }}
                  >
                    Clear
                  </button>
                )}
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0" ref={messageListRef}>
          <MessageList
            searchQuery={searchQuery}
            fromDate={fromDate}
            toDate={toDate}
            threadRootMessageId={threadRootMessage?.id}
          />
        </div>
        <InView
          className="h-4"
          rootMargin="20px"
          onChange={(inView) => {
            bottomVisibleRef.current = inView;
          }}
        >
          <div ref={bottomRef} className="h-4"></div>
        </InView>
        {!isAtBottom && (
          <button
            type="button"
            onClick={() => {
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full bg-background border border-border shadow-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Jump to latest"
          >
            <ArrowDown size={14} />
            <span>Jump to latest</span>
          </button>
        )}
        <div className="sticky bottom-0 bg-background pb-4 pt-2">
          <MessageCreate
            ref={messageCreateRef}
            threadRootMessageId={threadRootMessage?.id}
          />
        </div>
      </div>
    </ConversationContext.Provider>
  );
};
