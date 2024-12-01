import {
  hasAdminAccess,
  hasCollaboratorAccess,
  NodeRole,
} from '@colanode/core';
import React from 'react';
import { InView } from 'react-intersection-observer';

import {
  MessageCreate,
  MessageCreateRefProps,
} from '@/renderer/components/messages/message-create';
import { MessageList } from '@/renderer/components/messages/message-list';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { ConversationContext } from '@/renderer/contexts/conversation';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface ConversationProps {
  conversationId: string;
  role: NodeRole;
}

export const Conversation = ({ conversationId, role }: ConversationProps) => {
  const workspace = useWorkspace();

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<ResizeObserver | null>(null);
  const scrollPositionRef = React.useRef<number>(0);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const bottomVisibleRef = React.useRef<boolean>(false);
  const shouldScrollToBottomRef = React.useRef<boolean>(true);
  const messageCreateRef = React.useRef<MessageCreateRefProps>(null);

  React.useEffect(() => {
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

  const isAdmin = hasAdminAccess(role);
  const isCollaborator = hasCollaboratorAccess(role);

  return (
    <ConversationContext.Provider
      value={{
        id: conversationId,
        role,
        canCreateMessage: isCollaborator,
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
      <ScrollArea
        ref={viewportRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto px-10"
      >
        <div className="container" ref={containerRef}>
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
      </ScrollArea>
      <MessageCreate ref={messageCreateRef} />
    </ConversationContext.Provider>
  );
};
