import { eq, useLiveQuery } from '@tanstack/react-db';

import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface ReferencedUser {
  id: string;
  name: string;
  avatar: string | null;
}

export const useReferencedUser = (
  userId: string | undefined
): { user: ReferencedUser | null; isLoading: boolean } => {
  const workspace = useWorkspace();

  const query = useLiveQuery(
    (q) =>
      userId
        ? q
            .from({ users: workspace.collections.users })
            .where(({ users }) => eq(users.id, userId))
            .select(({ users }) => ({
              id: users.id,
              name: users.name,
              avatar: users.avatar,
            }))
            .findOne()
        : q.from({ users: workspace.collections.users }).where(() => false).findOne(),
    [workspace.userId, userId]
  );

  if (!userId) {
    return { user: null, isLoading: false };
  }

  return {
    user: (query.data as unknown as ReferencedUser | undefined) ?? null,
    isLoading: query.isLoading,
  };
};
