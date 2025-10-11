import { useState } from 'react';
import { InView } from 'react-intersection-observer';

import { LocalMessageNode } from '@colanode/client/types';
import { MessageActions } from '@colanode/ui/components/messages/message-actions';
import { MessageAuthorAvatar } from '@colanode/ui/components/messages/message-author-avatar';
import { MessageAuthorName } from '@colanode/ui/components/messages/message-author-name';
import { MessageContent } from '@colanode/ui/components/messages/message-content';
import { MessageDeleteDialog } from '@colanode/ui/components/messages/message-delete-dialog';
import { MessageMenuMobile } from '@colanode/ui/components/messages/message-menu-mobile';
import { MessageReactionCounts } from '@colanode/ui/components/messages/message-reaction-counts';
import { MessageReference } from '@colanode/ui/components/messages/message-reference';
import { MessageTime } from '@colanode/ui/components/messages/message-time';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { MessageContext } from '@colanode/ui/contexts/message';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { useLongPress } from '@colanode/ui/hooks/use-long-press';
import { cn } from '@colanode/ui/lib/utils';

interface MessageProps {
  message: LocalMessageNode;
  previousMessage?: LocalMessageNode | null;
}

const shouldDisplayAuthor = (
  message: LocalMessageNode,
  previousMessage?: LocalMessageNode | null
) => {
  if (!previousMessage) {
    return true;
  }

  const previousMessageDate = new Date(previousMessage.createdAt);
  const currentMessageDate = new Date(message.createdAt);

  if (previousMessageDate.getDate() !== currentMessageDate.getDate()) {
    return true;
  }

  return previousMessage.createdBy !== message.createdBy;
};

export const Message = ({ message, previousMessage }: MessageProps) => {
  const workspace = useWorkspace();
  const conversation = useConversation();

  const radar = useRadar();
  const isMobile = useIsMobile();

  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const displayAuthor = shouldDisplayAuthor(message, previousMessage);

  const longPressHandlers = isMobile
    ? useLongPress(
        () => {
          setIsMobileMenuOpen(true);
        },
        {
          onStart: () => {
            setIsLongPressing(true);
          },
          onFinish: () => {
            setIsLongPressing(false);
          },
          onCancel: () => {
            setIsLongPressing(false);
          },
        }
      )
    : {};

  return (
    <MessageContext.Provider
      value={{
        ...message,
        canDelete: conversation.canDeleteMessage(message),
        canReplyInThread: false,
        openDelete: () => {
          setOpenDeleteDialog(true);
        },
      }}
    >
      <div
        id={`message-${message.id}`}
        key={`message-${message.id}`}
        className={cn(
          'group flex flex-row px-1 rounded-sm transition-colors duration-150',
          isLongPressing
            ? 'bg-accent-foreground/10 scale-[0.98]'
            : 'hover:bg-accent',
          displayAuthor && 'mt-2 first:mt-0'
        )}
        {...longPressHandlers}
      >
        <div className="mr-2 w-10 pt-1">
          {displayAuthor && <MessageAuthorAvatar message={message} />}
        </div>

        <div className="relative w-full">
          {displayAuthor && (
            <div className="flex flex-row items-center gap-0.5">
              <MessageAuthorName message={message} />
              <MessageTime message={message} />
            </div>
          )}
          <InView
            rootMargin="50px"
            onChange={(inView) => {
              if (inView) {
                radar.markNodeAsSeen(workspace.userId, message.id);
              }
            }}
          >
            {!isMobile && <MessageActions />}
            {message.attributes.referenceId && (
              <MessageReference messageId={message.attributes.referenceId} />
            )}
            <MessageContent message={message} />
            <MessageReactionCounts message={message} />
          </InView>
        </div>

        {isMobile && (
          <MessageMenuMobile
            message={message}
            isOpen={isMobileMenuOpen}
            onOpenChange={setIsMobileMenuOpen}
          />
        )}
        {openDeleteDialog && (
          <MessageDeleteDialog
            id={message.id}
            open={openDeleteDialog}
            onOpenChange={setOpenDeleteDialog}
          />
        )}
      </div>
    </MessageContext.Provider>
  );
};
