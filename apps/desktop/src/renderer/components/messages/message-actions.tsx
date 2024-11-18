import React from 'react';
import { useConversation } from '@/renderer/contexts/conversation';
import { MessageNode } from '@colanode/core';
import { MessagesSquare, Reply } from 'lucide-react';
import { MessageReactionCreatePopover } from '@/renderer/components/messages/message-reaction-create-popover';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { MessageDeleteButton } from '@/renderer/components/messages/message-delete-button';
import { EmojiElement } from '@/renderer/components/emojis/emoji-element';
import { Separator } from '@/renderer/components/ui/separator';

const MessageAction = ({ children }: { children: React.ReactNode }) => {
  return (
    <li className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200">
      {children}
    </li>
  );
};

interface MessageActionsProps {
  message: MessageNode;
}

const quickReactions = [
  '01jc5vxx33b9nmy1a6yd71pee6em',
  '01jc5vxx32ez8g5394y7mzt2smem',
  '01jc5vxx374h4gxvgjsjf3kbn7em',
];

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
          userId: workspace.userId,
          reaction,
        },
      });
    },
    [isPending, mutate, workspace.userId, message.id]
  );

  return (
    <ul className="invisible absolute -top-2 right-1 z-10 flex flex-row items-center bg-gray-100 text-muted-foreground shadow group-hover:visible">
      {quickReactions.map((reaction) => (
        <MessageAction key={reaction}>
          <EmojiElement
            id={reaction}
            className="size-4"
            onClick={() => handleReactionClick(reaction)}
          />
        </MessageAction>
      ))}
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
                userId: workspace.userId,
                reaction,
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