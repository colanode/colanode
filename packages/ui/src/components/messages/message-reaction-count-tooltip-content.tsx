import { NodeReactionCount, LocalMessageNode } from '@colanode/client/types';
import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQueries } from '@colanode/ui/hooks/use-queries';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface MessageReactionCountTooltipContentProps {
  message: LocalMessageNode;
  reactionCount: NodeReactionCount;
}

export const MessageReactionCountTooltipContent = ({
  message,
  reactionCount,
}: MessageReactionCountTooltipContentProps) => {
  const workspace = useWorkspace();

  const emojiGetQuery = useQuery({
    type: 'emoji.get.by.skin.id',
    id: reactionCount.reaction,
  });

  const nodeReactionListQuery = useQuery({
    type: 'node.reaction.list',
    nodeId: message.id,
    reaction: reactionCount.reaction,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    page: 0,
    count: 3,
  });

  const userIds =
    nodeReactionListQuery.data?.map((reaction) => reaction.collaboratorId) ??
    [];

  const results = useQueries(
    userIds.map((userId) => ({
      type: 'user.get',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      userId,
    }))
  );

  const users = results
    .filter((result) => result.data !== null)
    .map((result) => result.data!.customName ?? result.data!.name);

  const emojiName = `:${emojiGetQuery.data?.code ?? reactionCount.reaction}:`;

  return (
    <div className="flex items-center gap-4">
      <EmojiElement id={reactionCount.reaction} className="h-5 w-5" />
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
