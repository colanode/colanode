import { NodeRole, hasNodeRole } from '@colanode/core';
import React from 'react';
import { InView } from 'react-intersection-observer';
import {
  MessageCreate,
  MessageCreateRefProps,
} from '@colanode/ui/components/messages/message-create';
import { MessageList } from '@colanode/ui/components/messages/message-list';
import { ScrollArea } from '@colanode/ui/components/ui/scroll-area';
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
        </ScrollArea>
        <MessageCreate ref={messageCreateRef} />
      </div>
    </ConversationContext.Provider>
  );
};
