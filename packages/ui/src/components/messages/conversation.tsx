import { useEffect, useRef } from 'react';
import { InView } from 'react-intersection-observer';

import { NodeRole, hasNodeRole } from '@colanode/core';
import {
  MessageCreate,
  MessageCreateRefProps,
} from '@colanode/ui/components/messages/message-create';
import { MessageList } from '@colanode/ui/components/messages/message-list';
import {
  ScrollArea,
  ScrollBar,
  ScrollViewport,
} from '@colanode/ui/components/ui/scroll-area';
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

  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomVisibleRef = useRef<boolean>(false);
  const shouldScrollToBottomRef = useRef<boolean>(true);
  const messageCreateRef = useRef<MessageCreateRefProps>(null);

  useEffect(() => {
    if (bottomRef.current && scrollPositionRef.current == 0) {
      bottomRef.current.scrollIntoView();
    }

    if (containerRef.current && viewportRef.current) {
      // observe resize of container when new messages are appended or internal elements are loaded (e.g. images)
      observerRef.current = new ResizeObserver(() => {
        if (viewportRef.current) {
          if (shouldScrollToBottomRef.current) {
            bottomRef.current?.scrollIntoView();
          } else {
            viewportRef.current.scrollTop =
              viewportRef.current.scrollHeight - scrollPositionRef.current;
          }
        }
      });

      observerRef.current.observe(containerRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }

    return () => {};
  }, [conversationId]);

  const handleScroll = () => {
    if (viewportRef.current) {
      scrollPositionRef.current =
        viewportRef.current.scrollHeight - viewportRef.current.scrollTop;

      shouldScrollToBottomRef.current = bottomVisibleRef.current;
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
      <div className="h-full min-h-full w-full min-w-full flex flex-col">
        <ScrollArea
          ref={viewportRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto"
        >
          <ScrollViewport>
            <div ref={containerRef}>
              <MessageList />
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
            <ScrollBar orientation="vertical" />
          </ScrollViewport>
        </ScrollArea>
        <MessageCreate ref={messageCreateRef} />
      </div>
    </ConversationContext.Provider>
  );
};
