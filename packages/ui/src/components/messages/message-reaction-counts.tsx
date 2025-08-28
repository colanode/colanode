import { useState } from 'react';
import { toast } from 'sonner';

import { LocalMessageNode } from '@colanode/client/types';
import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { MessageReactionCountTooltip } from '@colanode/ui/components/messages/message-reaction-count-tooltip';
import { MessageReactionCountsDialog } from '@colanode/ui/components/messages/message-reaction-counts-dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { cn } from '@colanode/ui/lib/utils';

interface MessageReactionCountsProps {
  message: LocalMessageNode;
}

export const MessageReactionCounts = ({
  message,
}: MessageReactionCountsProps) => {
  const workspace = useWorkspace();
  const [openDialog, setOpenDialog] = useState(false);

  const { mutate, isPending } = useMutation();

  const nodeReactionsAggregateQuery = useLiveQuery({
    type: 'node.reactions.aggregate',
    nodeId: message.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const reactionCounts = nodeReactionsAggregateQuery.data ?? [];
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
                'rouded flex flex-row items-center gap-2 p-1 shadow cursor-pointer text-sm text-muted-foreground hover:text-foreground bg-muted hover:bg-input',
                hasReacted && 'font-bold'
              )}
              onClick={() => {
                if (isPending) {
                  return;
                }

                if (hasReacted) {
                  mutate({
                    input: {
                      type: 'node.reaction.delete',
                      nodeId: message.id,
                      accountId: workspace.accountId,
                      workspaceId: workspace.id,
                      rootId: message.rootId,
                      reaction: reaction.reaction,
                    },
                    onError(error) {
                      toast.error(error.message);
                    },
                  });
                } else {
                  mutate({
                    input: {
                      type: 'node.reaction.create',
                      nodeId: message.id,
                      accountId: workspace.accountId,
                      workspaceId: workspace.id,
                      rootId: message.rootId,
                      reaction: reaction.reaction,
                    },
                    onError(error) {
                      toast.error(error.message);
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
