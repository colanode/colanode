import { ArrowDown, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { InView } from 'react-intersection-observer';

import { LocalMessageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { MessageActivityCalendar } from '@colanode/ui/components/messages/message-activity-calendar';
import {
  MessageCreate,
  MessageCreateRefProps,
} from '@colanode/ui/components/messages/message-create';
import { MessageList } from '@colanode/ui/components/messages/message-list';
import { PinnedMessagesPopover } from '@colanode/ui/components/messages/pinned-messages-popover';
import { Input } from '@colanode/ui/components/ui/input';
import { useContainer } from '@colanode/ui/contexts/container';
import { ConversationContext } from '@colanode/ui/contexts/conversation';
import { SearchHighlightContext } from '@colanode/ui/contexts/search-highlight';
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
  const [flashMessageId, setFlashMessageId] = useState<string | null>(null);
  const [threadRootMessage, setThreadRootMessage] =
    useState<LocalMessageNode | null>(null);

  const searchTerms = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length === 0) {
      return [];
    }
    return trimmed
      .split(/\s+/)
      .map((token) => token.replace(/^["']+|["']+$/g, ''))
      .filter((token) => token.length > 0);
  }, [searchQuery]);

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
        searchTerms,
        flashMessageId,
        onReply: (message) => {
          if (messageCreateRef.current) {
            messageCreateRef.current.setReplyTo(message);
          }
        },
        onReplyInThread: (message) => {
          setThreadRootMessage(message);
        },
        onLastMessageIdChange: () => {
          if (shouldScrollToBottomRef.current && bottomRef.current) {
            bottomRef.current.scrollIntoView();
          }
        },
        onLocateMessage: (messageId) => {
          setSearchQuery('');
          setFromDate('');
          setToDate('');
          setFlashMessageId(messageId);
          shouldScrollToBottomRef.current = false;
          requestAnimationFrame(() => {
            const el = document.getElementById(`message-${messageId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
          window.setTimeout(() => {
            setFlashMessageId((current) =>
              current === messageId ? null : current
            );
          }, 2000);
        },
        canDeleteMessage: (message) => {
          return isAdmin || message.createdBy === workspace.userId;
        },
      }}
    >
      <SearchHighlightContext.Provider value={{ terms: searchTerms }}>
        <div className="relative flex h-full flex-row">
          <div className="relative flex min-w-0 flex-1 flex-col">
            <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-2 py-2 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search messages"
                  className="h-8 min-w-52 flex-1"
                />
                <MessageActivityCalendar
                  selectedDay={fromDate}
                  onSelectDay={(day) => {
                    setFromDate(day);
                    setToDate(day);
                  }}
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
                  )}                <PinnedMessagesPopover />              </div>
            </div>
            <div className="flex-1 min-h-0" ref={messageListRef}>
              <MessageList
                searchQuery={searchQuery}
                fromDate={fromDate}
                toDate={toDate}
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
              <MessageCreate ref={messageCreateRef} />
            </div>
          </div>
          {threadRootMessage && (
            <aside className="sticky top-0 h-screen w-[400px] shrink-0 border-l border-border bg-background flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-sm font-medium">Thread</span>
                <button
                  type="button"
                  className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent"
                  onClick={() => setThreadRootMessage(null)}
                  aria-label="Close thread"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
                <MessageList threadRootMessageId={threadRootMessage.id} />
              </div>
              <div className="border-t border-border bg-background px-2 pb-3 pt-2">
                <MessageCreate
                  key={`thread-${threadRootMessage.id}`}
                  threadRootMessageId={threadRootMessage.id}
                />
              </div>
            </aside>
          )}
        </div>
      </SearchHighlightContext.Provider>
    </ConversationContext.Provider>
  );
};
