import { MessagesSquare, Reply, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { MessageQuickReaction } from '@colanode/ui/components/messages/message-quick-reaction';
import { MessageReactionCreatePopover } from '@colanode/ui/components/messages/message-reaction-create-popover';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useMessage } from '@colanode/ui/contexts/message';
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

export const MessageActions = () => {
  const message = useMessage();
  const workspace = useWorkspace();
  const conversation = useConversation();
  const { mutate, isPending } = useMutation();

  const handleReactionClick = useCallback(
    (reaction: string) => {
      if (isPending) {
        return;
      }

      mutate({
        input: {
          type: 'node.reaction.create',
          nodeId: message.id,
          userId: workspace.userId,
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
      {message.canReplyInThread && (
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
                userId: workspace.userId,
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
      {message.canDelete && (
        <MessageAction>
          <Trash2
            className="size-4 cursor-pointer"
            onClick={() => {
              message.openDelete();
            }}
          />
        </MessageAction>
      )}
    </ul>
  );
};
