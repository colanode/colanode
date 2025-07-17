import { useState } from 'react';
import { InView } from 'react-intersection-observer';

import { UserListQueryInput } from '@colanode/client/queries';
import { WorkspaceRole } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  Container,
  ContainerBody,
  ContainerHeader,
} from '@colanode/ui/components/ui/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { WorkspaceUserInvite } from '@colanode/ui/components/workspaces/workspace-user-invite';
import { WorkspaceUserRoleDropdown } from '@colanode/ui/components/workspaces/workspace-user-role-dropdown';
import { WorkspaceUsersBreadcrumb } from '@colanode/ui/components/workspaces/workspace-users-breadcrumb';
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
    <Container>
      <ContainerHeader>
        <WorkspaceUsersBreadcrumb />
      </ContainerHeader>
      <ContainerBody className="max-w-4xl">
        <div className="space-y-8">
          {canEditUsers && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Invite
                </h2>
                <Separator className="mt-3" />
              </div>
              <WorkspaceUserInvite workspace={workspace} />
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
        </div>
      </ContainerBody>
    </Container>
  );
};
