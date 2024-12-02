import { WorkspaceRole } from '@colanode/core';
import React from 'react';
import { InView } from 'react-intersection-observer';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { Separator } from '@/renderer/components/ui/separator';
import { Spinner } from '@/renderer/components/ui/spinner';
import { WorkspaceUserInvite } from '@/renderer/components/workspaces/workspace-user-invite';
import { WorkspaceUserRoleDropdown } from '@/renderer/components/workspaces/workspace-user-role-dropdown';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQueries } from '@/renderer/hooks/use-queries';
import { WorkspaceUserListQueryInput } from '@/shared/queries/workspaces/workspace-user-list';

const USERS_PER_PAGE = 50;

export const WorkspaceUsers = () => {
  const workspace = useWorkspace();
  const canEditUsers = workspace.role === 'owner' || workspace.role === 'admin';
  const [lastPage, setLastPage] = React.useState<number>(1);

  const inputs: WorkspaceUserListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'workspace_user_list',
    page: i + 1,
    count: USERS_PER_PAGE,
    userId: workspace.userId,
  }));

  const result = useQueries(inputs);
  const users = result.flatMap((data) => data.data ?? []);
  const isPending = result.some((data) => data.isPending);
  const hasMore = !isPending && users.length === lastPage * USERS_PER_PAGE;

  return (
    <div className="flex flex-col space-y-4">
      {canEditUsers && (
        <React.Fragment>
          <WorkspaceUserInvite workspace={workspace} />
          <Separator />
        </React.Fragment>
      )}
      <div>
        <p>Users</p>
        <p className="text-sm text-muted-foreground">
          The list of all users on the workspaces
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {users.map((user) => {
          const name: string = user.attributes.name ?? 'Unknown';
          const email: string = user.attributes.email ?? ' ';
          const avatar: string | null | undefined = user.attributes.avatar;
          const role: WorkspaceRole = user.attributes.role;

          if (!role) {
            return null;
          }

          return (
            <div key={user.id} className="flex items-center space-x-3">
              <Avatar id={user.id} name={name} avatar={avatar} />
              <div className="flex-grow">
                <p className="text-sm font-medium leading-none">
                  {user.attributes.name}
                </p>
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
        <div className="flex items-center justify-center space-x-3">
          {isPending && <Spinner />}
        </div>
        <InView
          rootMargin="200px"
          onChange={(inView) => {
            if (inView && hasMore && !isPending) {
              setLastPage(lastPage + 1);
            }
          }}
        ></InView>
      </div>
    </div>
  );
};
