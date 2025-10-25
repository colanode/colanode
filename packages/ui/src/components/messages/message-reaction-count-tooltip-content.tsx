import {
  inArray,
  useLiveQuery as useLiveQueryTanstack,
} from '@tanstack/react-db';

import { NodeReactionCount, LocalMessageNode } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface MessageReactionCountTooltipContentProps {
  message: LocalMessageNode;
  reactionCount: NodeReactionCount;
}

export const MessageReactionCountTooltipContent = ({
  message,
  reactionCount,
}: MessageReactionCountTooltipContentProps) => {
  const workspace = useWorkspace();

  const emojiGetQuery = useLiveQuery({
    type: 'emoji.get.by.skin.id',
    id: reactionCount.reaction,
  });

  const nodeReactionListQuery = useLiveQuery({
    type: 'node.reaction.list',
    nodeId: message.id,
    reaction: reactionCount.reaction,
    userId: workspace.userId,
    page: 0,
    count: 3,
  });

  const userIds =
    nodeReactionListQuery.data?.map((reaction) => reaction.collaboratorId) ??
    [];

  const usersQuery = useLiveQueryTanstack((q) =>
    q
      .from({ users: collections.workspace(workspace.userId).users })
      .where(({ users }) => inArray(users.id, userIds))
      .select(({ users }) => ({
        name: users.name,
        customName: users.customName,
      }))
  );

  const users = usersQuery.data.map((user) => user.customName ?? user.name);
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
