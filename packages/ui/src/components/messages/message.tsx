import { useState } from 'react';
import { InView } from 'react-intersection-observer';
import { toast } from 'sonner';
import { Pin } from 'lucide-react';

import { LocalMessageNode } from '@colanode/client/types';
import { formatDate } from '@colanode/core';
import { MessageActions } from '@colanode/ui/components/messages/message-actions';
import { MessageAuthorAvatar } from '@colanode/ui/components/messages/message-author-avatar';
import { MessageAuthorName } from '@colanode/ui/components/messages/message-author-name';
import { MessageContent } from '@colanode/ui/components/messages/message-content';
import { MessageEditInline } from '@colanode/ui/components/messages/message-edit-inline';
import { MessageForwardDialog } from '@colanode/ui/components/messages/message-forward-dialog';
import { MessageMenuMobile } from '@colanode/ui/components/messages/message-menu-mobile';
import { MessageReactionCounts } from '@colanode/ui/components/messages/message-reaction-counts';
import { MessageReference } from '@colanode/ui/components/messages/message-reference';
import { MessageTime } from '@colanode/ui/components/messages/message-time';
import { NodeDeleteDialog } from '@colanode/ui/components/nodes/node-delete-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { MessageContext } from '@colanode/ui/contexts/message';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { useLongPress } from '@colanode/ui/hooks/use-long-press';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { cn } from '@colanode/ui/lib/utils';

interface MessageProps {
  message: LocalMessageNode;
  previousMessage?: LocalMessageNode | null;
}

const formatShortTime = (value: string): string => {
  const date = new Date(value);
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
};

const GROUP_THRESHOLD_MS = 5 * 60 * 1000;

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

  if (previousMessage.createdBy !== message.createdBy) {
    return true;
  }

  return (
    currentMessageDate.getTime() - previousMessageDate.getTime() >
    GROUP_THRESHOLD_MS
  );
};

export const Message = ({ message, previousMessage }: MessageProps) => {
  const workspace = useWorkspace();
  const conversation = useConversation();

  const radar = useRadar();
  const isMobile = useIsMobile();

  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openForwardDialog, setOpenForwardDialog] = useState(false);

  const canEdit = message.createdBy === workspace.userId;
  const canPin = canEdit;
  const canForward = conversation.canCreateMessage;
  const isPinned = Boolean(message.pinnedAt);

  const { mutate: mutatePin } = useMutation();

  const togglePin = () => {
    mutatePin({
      input: {
        type: 'message.pin',
        userId: workspace.userId,
        messageId: message.id,
        pinned: !isPinned,
      },
      onError: (error) => toast.error(error.message),
    });
  };

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
        canEdit,
        canForward,
        canPin,
        canReplyInThread: conversation.canCreateMessage,
        isEditing,
        isPinned,
        openDelete: () => {
          setOpenDeleteDialog(true);
        },
        openEdit: () => {
          if (canEdit) {
            setIsEditing(true);
          }
        },
        closeEdit: () => {
          setIsEditing(false);
        },
        openForward: () => {
          setOpenForwardDialog(true);
        },
        togglePin,
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
          displayAuthor && 'mt-2 first:mt-0',
          conversation.flashMessageId === message.id &&
          'bg-yellow-200/60 dark:bg-yellow-500/20 ring-2 ring-yellow-400/70 animate-pulse'
        )}
        {...longPressHandlers}
      >
        <div className="mr-2 w-10 pt-1">
          {displayAuthor ? (
            <MessageAuthorAvatar message={message} />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block text-right pr-1 text-[10px] leading-5 text-muted-foreground/70 select-none">
                  {formatShortTime(message.createdAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-sm shadow-md">
                  {formatDate(message.createdAt)}
                </span>
              </TooltipContent>
            </Tooltip>
          )}
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
            {!isMobile && !isEditing && <MessageActions />}
            {isPinned && (
              <div className="mb-1 inline-flex items-center gap-1 rounded bg-yellow-200/60 px-1.5 py-0.5 text-[10px] font-medium text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200">
                <Pin className="size-3" />
                <span>Pinned</span>
              </div>
            )}
            {message.referenceId && (
              <MessageReference messageId={message.referenceId} />
            )}
            {isEditing ? (
              <MessageEditInline
                message={message}
                onClose={() => setIsEditing(false)}
              />
            ) : (
              <MessageContent message={message} />
            )}
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
          <NodeDeleteDialog
            id={message.id}
            title="Are you sure you want delete this message?"
            description="This action cannot be undone. This message will no longer be accessible by you or others you've shared it with."
            open={openDeleteDialog}
            onOpenChange={setOpenDeleteDialog}
          />
        )}
        {openForwardDialog && (
          <MessageForwardDialog
            message={message}
            open={openForwardDialog}
            onOpenChange={setOpenForwardDialog}
          />
        )}
      </div>
    </MessageContext.Provider>
  );
};
