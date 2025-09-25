import { useEffect, useRef } from 'react';
import { InView } from 'react-intersection-observer';

import { NodeRole, hasNodeRole } from '@colanode/core';
import {
  MessageCreate,
  MessageCreateRefProps,
} from '@colanode/ui/components/messages/message-create';
import { MessageList } from '@colanode/ui/components/messages/message-list';
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

    return () => {};
  }, [conversationId]);

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      scrollPositionRef.current =
        scrollAreaRef.current.scrollHeight - scrollAreaRef.current.scrollTop;

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
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-0" ref={messageListRef}>
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
        <div className="sticky bottom-0 bg-background pb-4 pt-2">
          <MessageCreate ref={messageCreateRef} />
        </div>
      </div>
    </ConversationContext.Provider>
  );
};
