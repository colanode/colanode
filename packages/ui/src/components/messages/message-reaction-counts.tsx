import { count, eq, useLiveQuery } from '@tanstack/react-db';
import { useCallback, useState } from 'react';

import { LocalMessageNode } from '@colanode/client/types';
import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { MessageReactionCountTooltip } from '@colanode/ui/components/messages/message-reaction-count-tooltip';
import { MessageReactionCountsDialog } from '@colanode/ui/components/messages/message-reaction-counts-dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { buildNodeReactionKey } from '@colanode/ui/lib/nodes';
import { cn } from '@colanode/ui/lib/utils';

interface MessageReactionCountsProps {
  message: LocalMessageNode;
}

export const MessageReactionCounts = ({
  message,
}: MessageReactionCountsProps) => {
  const workspace = useWorkspace();
  const [openDialog, setOpenDialog] = useState(false);

  const handleReactionClick = useCallback((reaction: string) => {
    const reactionKey = buildNodeReactionKey(
      message.id,
      workspace.userId,
      reaction
    );
    if (workspace.collections.nodeReactions.has(reactionKey)) {
      workspace.collections.nodeReactions.delete(reactionKey);
    } else {
      workspace.collections.nodeReactions.insert({
        nodeId: message.id,
        collaboratorId: workspace.userId,
        reaction,
        rootId: message.rootId,
        createdAt: new Date().toISOString(),
      });
    }
  }, []);

  const reactionCountsQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodeReactions: workspace.collections.nodeReactions })
        .where(({ nodeReactions }) => eq(nodeReactions.nodeId, message.id))
        .groupBy(({ nodeReactions }) => nodeReactions.reaction)
        .select(({ nodeReactions }) => ({
          reaction: nodeReactions.reaction,
          count: count(nodeReactions.reaction),
        })),
    [message.id]
  );

  const currentUserReactionsQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodeReactions: workspace.collections.nodeReactions })
        .where(({ nodeReactions }) => eq(nodeReactions.nodeId, message.id))
        .where(({ nodeReactions }) =>
          eq(nodeReactions.collaboratorId, workspace.userId)
        ),
    [message.id]
  );

  const reactionCounts = reactionCountsQuery.data ?? [];
  if (reactionCounts.length === 0) {
    return null;
  }

  return (
    <div className="my-1 flex flex-row gap-2">
      {reactionCounts.map((reaction) => {
        if (reaction.count === 0) {
          return null;
        }

        const hasReacted = currentUserReactionsQuery.data?.some(
          (userReaction) => userReaction.reaction === reaction.reaction
        );

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
                handleReactionClick(reaction.reaction);
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
