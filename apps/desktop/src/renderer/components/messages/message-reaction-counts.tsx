import React from 'react';
import { LocalMessageNode } from '@colanode/client/types';

import { EmojiElement } from '@/renderer/components/emojis/emoji-element';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { cn } from '@/shared/lib/utils';
import { toast } from '@/renderer/hooks/use-toast';
import { useQuery } from '@/renderer/hooks/use-query';
import { MessageReactionCountTooltip } from '@/renderer/components/messages/message-reaction-count-tooltip';
import { MessageReactionCountsDialog } from '@/renderer/components/messages/message-reaction-counts-dialog';

interface MessageReactionCountsProps {
  message: LocalMessageNode;
}

export const MessageReactionCounts = ({
  message,
}: MessageReactionCountsProps) => {
  const workspace = useWorkspace();
  const [openDialog, setOpenDialog] = React.useState(false);

  const { mutate, isPending } = useMutation();

  const { data } = useQuery({
    type: 'node_reactions_aggregate',
    nodeId: message.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const reactionCounts = data ?? [];
  if (reactionCounts.length === 0) {
    return null;
  }

  return (
    <div className="my-1 flex flex-row gap-2">
      {reactionCounts.map((reaction) => {
        if (reaction.count === 0) {
          return null;
        }

        const hasReacted = reaction.reacted;
        return (
          <MessageReactionCountTooltip
            key={reaction.reaction}
            message={message}
            reactionCount={reaction}
            onOpen={() => {
              setOpenDialog(true);
            }}
          >
            <div
              key={reaction.reaction}
              className={cn(
                'rouded flex flex-row items-center gap-2 px-1 py-0.5 shadow',
                'cursor-pointer text-sm text-muted-foreground hover:text-foreground',
                hasReacted ? 'bg-blue-100' : 'bg-gray-50'
              )}
              onClick={() => {
                if (isPending) {
                  return;
                }

                if (hasReacted) {
                  mutate({
                    input: {
                      type: 'node_reaction_delete',
                      nodeId: message.id,
                      accountId: workspace.accountId,
                      workspaceId: workspace.id,
                      rootId: message.rootId,
                      reaction: reaction.reaction,
                    },
                    onError(error) {
                      toast({
                        title: 'Failed to remove reaction',
                        description: error.message,
                        variant: 'destructive',
                      });
                    },
                  });
                } else {
                  mutate({
                    input: {
                      type: 'node_reaction_create',
                      nodeId: message.id,
                      accountId: workspace.accountId,
                      workspaceId: workspace.id,
                      rootId: message.rootId,
                      reaction: reaction.reaction,
                    },
                    onError(error) {
                      toast({
                        title: 'Failed to add reaction',
                        description: error.message,
                        variant: 'destructive',
                      });
                    },
                  });
                }
              }}
            >
              <EmojiElement id={reaction.reaction} className="size-5" />
              <span>{reaction.count}</span>
            </div>
          </MessageReactionCountTooltip>
        );
      })}
      {openDialog && (
        <MessageReactionCountsDialog
          message={message}
          reactionCounts={reactionCounts}
          open={openDialog}
          onOpenChange={setOpenDialog}
        />
      )}
    </div>
  );
};
