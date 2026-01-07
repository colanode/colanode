import { useLiveInfiniteQuery } from '@tanstack/react-db';
import { InView } from 'react-intersection-observer';

import { WorkspaceRole } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Container } from '@colanode/ui/components/layouts/containers/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceUserInvite } from '@colanode/ui/components/workspaces/workspace-user-invite';
import { WorkspaceUserRoleDropdown } from '@colanode/ui/components/workspaces/workspace-user-role-dropdown';
import { WorkspaceUsersBreadcrumb } from '@colanode/ui/components/workspaces/workspace-users-breadcrumb';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const USERS_PER_PAGE = 50;

export const WorkspaceUsersContainer = () => {
  const workspace = useWorkspace();
  const canEditUsers = workspace.role === 'owner' || workspace.role === 'admin';

  const usersQuery = useLiveInfiniteQuery(
    (q) =>
      q
        .from({ users: workspace.collections.users })
        .orderBy(({ users }) => users.id, 'asc'),
    {
      pageSize: USERS_PER_PAGE,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === USERS_PER_PAGE ? allPages.length : undefined,
    },
    [workspace.userId]
  );

  const users = usersQuery.data;

  return (
    <Container type="full" breadcrumb={<WorkspaceUsersBreadcrumb />}>
      <div className="max-w-4xl space-y-8">
        {canEditUsers && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Invite</h2>
              <Separator className="mt-3" />
            </div>
            <WorkspaceUserInvite />
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
            <p className="text-sm text-muted-foreground mt-1">
              The list of all users on the workspace
            </p>
            <Separator className="mt-3" />
          </div>
          <div className="flex flex-col gap-3">
            {users.map((user) => {
              const name: string = user.name ?? 'Unknown';
              const email: string = user.email ?? ' ';
              const avatar: string | null | undefined = user.avatar;
              const role: WorkspaceRole = user.role;

              if (!role) {
                return null;
              }

              return (
                <div key={user.id} className="flex items-center space-x-3">
                  <Avatar id={user.id} name={name} avatar={avatar} />
                  <div className="grow">
                    <p className="text-sm font-medium leading-none">{name}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                  <WorkspaceUserRoleDropdown
                    userId={user.id}
                    value={role}
                    canEdit={canEditUsers}
                  />
                </div>
              );
            })}
            <InView
              rootMargin="200px"
              onChange={(inView) => {
                if (inView && users.length === USERS_PER_PAGE) {
                  usersQuery.fetchNextPage();
                }
              }}
            />
          </div>
        </div>
      </div>
    </Container>
  );
};
