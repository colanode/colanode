import { eq, inArray, useLiveQuery } from '@tanstack/react-db';

import { NodeReactionCount, LocalMessageNode } from '@colanode/client/types';
import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery as useColanodeLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface MessageReactionCountTooltipContentProps {
  message: LocalMessageNode;
  reactionCount: NodeReactionCount;
}

export const MessageReactionCountTooltipContent = ({
  message,
  reactionCount,
}: MessageReactionCountTooltipContentProps) => {
  const workspace = useWorkspace();

  const emojiGetQuery = useColanodeLiveQuery({
    type: 'emoji.get.by.skin.id',
    id: reactionCount.reaction,
  });

  const nodeReactionListQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodeReactions: workspace.collections.nodeReactions })
        .where(({ nodeReactions }) => eq(nodeReactions.nodeId, message.id))
        .where(({ nodeReactions }) =>
          eq(nodeReactions.reaction, reactionCount.reaction)
        )
        .orderBy(({ nodeReactions }) => nodeReactions.createdAt, 'desc')
        .limit(3),
    [message.id, reactionCount.reaction]
  );

  const nodeReactions = nodeReactionListQuery.data ?? [];
  const userIds = nodeReactions.map((reaction) => reaction.collaboratorId);

  const usersQuery = useLiveQuery((q) =>
    q
      .from({ users: workspace.collections.users })
      .where(({ users }) => inArray(users.id, userIds))
      .select(({ users }) => ({
        name: users.name,
        customName: users.customName,
      }))
  );

  const users =
    usersQuery.data?.map((user) => user.customName ?? user.name) ?? [];
  const emojiName = `:${emojiGetQuery.data?.code ?? emojiGetQuery.data?.name ?? reactionCount.reaction}:`;

  return (
    <div className="flex items-center gap-4">
      <EmojiElement id={reactionCount.reaction} className="size-5" />
      {users.length === 1 && (
        <p>
          <span className="font-semibold">{users[0]}</span>
          <span className="text-muted-foreground"> reacted with </span>
          <span className="font-semibold">{emojiName}</span>
        </p>
      )}
      {users.length === 2 && (
        <p>
          <span className="font-semibold">{users[0]}</span>
          <span className="text-muted-foreground"> and </span>
          <span className="font-semibold">{users[1]}</span>
          <span className="text-muted-foreground"> reacted with</span>
          <span className="font-semibold">{emojiName}</span>
        </p>
      )}
      {users.length === 3 && (
        <p>
          <span className="font-semibold">{users[0]}</span>
          <span className="text-muted-foreground">, </span>
          <span className="font-semibold">{users[1]}</span>
          <span className="text-muted-foreground"> and </span>
          <span className="font-semibold">{users[2]}</span>
          <span className="text-muted-foreground"> reacted with</span>
          <span className="font-semibold">{emojiName}</span>
        </p>
      )}
      {users.length > 3 && (
        <p className="text-muted-foreground">
          {users.length} people reacted with {emojiName}
        </p>
      )}
    </div>
  );
};
