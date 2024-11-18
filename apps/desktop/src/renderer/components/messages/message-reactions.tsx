import { MessageNode } from '@colanode/core';
import { EmojiElement } from '@/renderer/components/emojis/emoji-element';
import { cn } from '@/shared/lib/utils';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';

interface MessageReactionsProps {
  message: MessageNode;
}

export const MessageReactions = ({ message }: MessageReactionsProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const reactionCounts = Object.entries(message.attributes.reactions ?? {})
    .map(([reaction, users]) => ({
      reaction,
      count: users.length,
      isReactedTo: users.includes(workspace.userId),
    }))
    .filter((reactionCount) => reactionCount.count > 0);

  if (reactionCounts.length === 0) {
    return null;
  }

  return (
    <div className="my-1 flex flex-row gap-2">
      {reactionCounts.map((reaction) => {
        if (reaction.count === 0) {
          return null;
        }

        const hasReacted = reaction.isReactedTo;
        return (
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

              if (
                reactionCounts.some(
                  (reactionCount) =>
                    reactionCount.reaction === reaction.reaction &&
                    reactionCount.isReactedTo
                )
              ) {
                mutate({
                  input: {
                    type: 'node_reaction_delete',
                    nodeId: message.id,
                    userId: workspace.userId,
                    reaction: reaction.reaction,
                  },
                });
              } else {
                mutate({
                  input: {
                    type: 'node_reaction_create',
                    nodeId: message.id,
                    userId: workspace.userId,
                    reaction: reaction.reaction,
                  },
                });
              }
            }}
          >
            <EmojiElement id={reaction.reaction} className="size-5" />
            <span>{reaction.count}</span>
          </div>
        );
      })}
    </div>
  );
};
