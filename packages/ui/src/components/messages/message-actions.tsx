import { MessagesSquare, Reply } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { LocalMessageNode } from '@colanode/client/types';
import { MessageDeleteButton } from '@colanode/ui/components/messages/message-delete-button';
import { MessageQuickReaction } from '@colanode/ui/components/messages/message-quick-reaction';
import { MessageReactionCreatePopover } from '@colanode/ui/components/messages/message-reaction-create-popover';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { defaultEmojis } from '@colanode/ui/lib/assets';

const MessageAction = ({ children }: { children: React.ReactNode }) => {
  return (
    <li className="flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-input">
      {children}
    </li>
  );
};

interface MessageActionsProps {
  message: LocalMessageNode;
}

export const MessageActions = ({ message }: MessageActionsProps) => {
  const workspace = useWorkspace();
  const conversation = useConversation();
  const { mutate, isPending } = useMutation();

  const canDelete = conversation.canDeleteMessage(message);
  const canReplyInThread = false;

  const handleReactionClick = useCallback(
    (reaction: string) => {
      if (isPending) {
        return;
      }

      mutate({
        input: {
          type: 'node.reaction.create',
          nodeId: message.id,
          accountId: workspace.accountId,
          workspaceId: workspace.id,
          reaction,
          rootId: conversation.rootId,
        },
        onError(error) {
          toast.error(error.message);
        },
      });
    },
    [isPending, mutate, workspace.userId, message.id]
  );

  return (
    <ul className="invisible absolute -top-5 right-1 z-10 flex flex-row items-center rounded-md bg-muted p-0.5 text-muted-foreground shadow-md group-hover:visible">
      <MessageAction>
        <MessageQuickReaction
          emoji={defaultEmojis.like}
          onClick={handleReactionClick}
        />
      </MessageAction>
      <MessageAction>
        <MessageQuickReaction
          emoji={defaultEmojis.heart}
          onClick={handleReactionClick}
        />
      </MessageAction>
      <MessageAction>
        <MessageQuickReaction
          emoji={defaultEmojis.check}
          onClick={handleReactionClick}
        />
      </MessageAction>
      <div className="mx-1 h-6 w-[1px] bg-border" />
      {canReplyInThread && (
        <MessageAction>
          <MessagesSquare className="size-4 cursor-pointer" />
        </MessageAction>
      )}
      <MessageAction>
        <MessageReactionCreatePopover
          onReactionClick={(reaction) => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'node.reaction.create',
                nodeId: message.id,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
                reaction,
                rootId: conversation.rootId,
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
        />
      </MessageAction>
      {conversation.canCreateMessage && (
        <MessageAction>
          <Reply
            className="size-4 cursor-pointer"
            onClick={() => {
              conversation.onReply(message);
            }}
          />
        </MessageAction>
      )}
      {canDelete && (
        <MessageAction>
          <MessageDeleteButton id={message.id} />
        </MessageAction>
      )}
    </ul>
  );
};
