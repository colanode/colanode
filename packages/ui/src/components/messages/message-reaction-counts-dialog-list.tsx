import {
  inArray,
  useLiveQuery as useLiveQueryTanstack,
} from '@tanstack/react-db';
import { useState } from 'react';
import { InView } from 'react-intersection-observer';

import { NodeReactionListQueryInput } from '@colanode/client/queries';
import { NodeReactionCount, LocalMessageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';
import { useLiveQueries } from '@colanode/ui/hooks/use-live-queries';

const REACTIONS_PER_PAGE = 20;

interface MessageReactionCountsDialogListProps {
  message: LocalMessageNode;
  reactionCount: NodeReactionCount;
}

export const MessageReactionCountsDialogList = ({
  message,
  reactionCount,
}: MessageReactionCountsDialogListProps) => {
  const workspace = useWorkspace();

  const [lastPage, setLastPage] = useState<number>(1);
  const inputs: NodeReactionListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'node.reaction.list',
    nodeId: message.id,
    reaction: reactionCount.reaction,
    userId: workspace.userId,
    page: i + 1,
    count: REACTIONS_PER_PAGE,
  }));

  const result = useLiveQueries(inputs);
  const reactions = result.flatMap((data) => data.data ?? []);
  const isPending = result.some((data) => data.isPending);
  const hasMore =
    !isPending && reactions.length === lastPage * REACTIONS_PER_PAGE;

  const userIds = reactions?.map((reaction) => reaction.collaboratorId) ?? [];

  const usersQuery = useLiveQueryTanstack((q) =>
    q
      .from({ users: database.workspace(workspace.userId).users })
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
          <p className="flex-grow text-sm font-medium leading-none">
            {user.name}
          </p>
        </div>
      ))}
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (inView && hasMore && !isPending) {
            setLastPage(lastPage + 1);
          }
        }}
      ></InView>
    </div>
  );
};
