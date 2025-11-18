import { useInfiniteQuery } from '@tanstack/react-query';
import { BadgeAlert } from 'lucide-react';
import { InView } from 'react-intersection-observer';

import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { WorkspaceStorageUserTable } from '@colanode/ui/components/workspaces/storage/workspace-storage-user-table';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const USERS_PER_PAGE = 100;

export const WorkspaceStorageUsers = () => {
  const workspace = useWorkspace();
  const canManageStorage =
    workspace.role === 'owner' || workspace.role === 'admin';

  const usersQuery = useInfiniteQuery({
    queryKey: ['workspace-storage-users', workspace.userId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      window.colanode.executeQuery({
        type: 'workspace.storage.users.get',
        userId: workspace.userId,
        limit: USERS_PER_PAGE,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.users.length < USERS_PER_PAGE) {
        return undefined;
      }

      const lastUser = lastPage.users[lastPage.users.length - 1];
      return lastUser?.id;
    },
  });

  const users = usersQuery.data?.pages.flatMap((page) => page.users) ?? [];

  if (!canManageStorage) {
    return null;
  }

  const handleUsersUpdated = () => {
    usersQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          View and manage storage usage for each workspace user.
        </p>
        <Separator className="mt-3" />
      </div>
      {usersQuery.isPending && users.length === 0 ? (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          <span>Loading user storage information...</span>
        </div>
      ) : usersQuery.isError && users.length === 0 ? (
        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <BadgeAlert className="size-8 text-red-400" />
            <span>
              Couldn't load workspace user storage details. Please try again.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => usersQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-sm text-muted-foreground">No users found.</div>
      ) : (
        <>
          <WorkspaceStorageUserTable
            users={users}
            onUsersUpdated={handleUsersUpdated}
          />
          <div className="flex items-center justify-center py-4">
            {usersQuery.isFetchingNextPage && <Spinner className="size-4" />}
          </div>
          {usersQuery.hasNextPage && (
            <InView
              rootMargin="200px"
              onChange={(inView) => {
                if (
                  inView &&
                  usersQuery.hasNextPage &&
                  !usersQuery.isFetchingNextPage
                ) {
                  usersQuery.fetchNextPage();
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
};
