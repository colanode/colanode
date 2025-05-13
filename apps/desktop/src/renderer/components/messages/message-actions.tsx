import { MessagesSquare, Reply } from 'lucide-react';
import React from 'react';
import { LocalMessageNode } from '@colanode/client/types';

import { MessageDeleteButton } from '@/renderer/components/messages/message-delete-button';
import { MessageReactionCreatePopover } from '@/renderer/components/messages/message-reaction-create-popover';
import { MessageQuickReaction } from '@/renderer/components/messages/message-quick-reaction';
import { Separator } from '@/renderer/components/ui/separator';
import { useConversation } from '@/renderer/contexts/conversation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { defaultEmojis } from '@/shared/lib/assets';

const MessageAction = ({ children }: { children: React.ReactNode }) => {
  return (
    <li className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200">
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

  const handleReactionClick = React.useCallback(
    (reaction: string) => {
      if (isPending) {
        return;
      }

      mutate({
        input: {
          type: 'node_reaction_create',
          nodeId: message.id,
          accountId: workspace.accountId,
          workspaceId: workspace.id,
          reaction,
          rootId: conversation.rootId,
        },
        onError(error) {
          toast({
            title: 'Failed to add reaction',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    },
    [isPending, mutate, workspace.userId, message.id]
  );

  return (
    <ul className="invisible absolute -top-2 right-1 z-10 flex flex-row items-center bg-gray-100 text-muted-foreground shadow group-hover:visible">
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
      <Separator orientation="vertical" className="h-6 w-[2px] mx-1" />
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
                type: 'node_reaction_create',
                nodeId: message.id,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
                reaction,
                rootId: conversation.rootId,
              },
              onError(error) {
                toast({
                  title: 'Failed to add reaction',
                  description: error.message,
                  variant: 'destructive',
                });
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
