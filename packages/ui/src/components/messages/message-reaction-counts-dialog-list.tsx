import {
  and,
  eq,
  inArray,
  useLiveInfiniteQuery,
  useLiveQuery,
} from '@tanstack/react-db';
import { InView } from 'react-intersection-observer';

import { NodeReactionCount, LocalMessageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const REACTIONS_PER_PAGE = 50;

interface MessageReactionCountsDialogListProps {
  message: LocalMessageNode;
  reactionCount: NodeReactionCount;
}

export const MessageReactionCountsDialogList = ({
  message,
  reactionCount,
}: MessageReactionCountsDialogListProps) => {
  const workspace = useWorkspace();

  const reactionsQuery = useLiveInfiniteQuery(
    (q) =>
      q
        .from({ nodeReactions: workspace.collections.nodeReactions })
        .where(({ nodeReactions }) =>
          and(
            eq(nodeReactions.nodeId, message.id),
            eq(nodeReactions.reaction, reactionCount.reaction)
          )
        )
        .orderBy(({ nodeReactions }) => nodeReactions.createdAt, 'desc'),
    {
      pageSize: REACTIONS_PER_PAGE,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === REACTIONS_PER_PAGE ? allPages.length : undefined,
    },
    [workspace.userId, message.id, reactionCount.reaction]
  );

  const reactions = reactionsQuery.data;
  const userIds = reactions?.map((reaction) => reaction.collaboratorId) ?? [];

  const usersQuery = useLiveQuery((q) =>
    q
      .from({ users: workspace.collections.users })
      .where(({ users }) => inArray(users.id, userIds))
      .select(({ users }) => ({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      }))
  );

  const users = usersQuery.data;
  return (
    <div className="flex flex-col gap-2 p-2">
      {users.map((user) => (
        <div key={user.id} className="flex items-center space-x-3">
          <Avatar
            id={user.id}
            name={user.name}
            avatar={user.avatar}
            className="size-5"
          />
          <p className="grow text-sm font-medium leading-none">{user.name}</p>
        </div>
      ))}
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (
            inView &&
            reactionsQuery.hasNextPage &&
            !reactionsQuery.isFetchingNextPage
          ) {
            reactionsQuery.fetchNextPage();
          }
        }}
      />
    </div>
  );
};
