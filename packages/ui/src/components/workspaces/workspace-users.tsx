import { Fragment, useState } from 'react';
import { InView } from 'react-intersection-observer';

import { UserListQueryInput } from '@colanode/client/queries';
import { WorkspaceRole } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { WorkspaceUserInvite } from '@colanode/ui/components/workspaces/workspace-user-invite';
import { WorkspaceUserRoleDropdown } from '@colanode/ui/components/workspaces/workspace-user-role-dropdown';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQueries } from '@colanode/ui/hooks/use-queries';

const USERS_PER_PAGE = 50;

export const WorkspaceUsers = () => {
  const workspace = useWorkspace();
  const canEditUsers = workspace.role === 'owner' || workspace.role === 'admin';
  const [lastPage, setLastPage] = useState<number>(1);

  const inputs: UserListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'user.list',
    page: i + 1,
    count: USERS_PER_PAGE,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  }));

  const result = useQueries(inputs);
  const users = result.flatMap((data) => data.data ?? []);
  const isPending = result.some((data) => data.isPending);
  const hasMore = !isPending && users.length === lastPage * USERS_PER_PAGE;

  return (
    <div className="flex flex-col space-y-4">
      {canEditUsers && (
        <Fragment>
          <WorkspaceUserInvite workspace={workspace} />
          <Separator />
        </Fragment>
      )}
      <div>
        <p>Users</p>
        <p className="text-sm text-muted-foreground">
          The list of all users on the workspaces
        </p>
      </div>
      <div className="flex flex-col gap-2">
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
              <div className="flex-grow">
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
