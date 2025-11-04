import { eq, useLiveQuery } from '@tanstack/react-db';
import { useParams } from '@tanstack/react-router';

import { collections } from '@colanode/ui/collections';
import { ServerProvider } from '@colanode/ui/components/servers/server-provider';
import { WorkspaceLayout } from '@colanode/ui/components/workspaces/workspace-layout';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { WorkspaceContext } from '@colanode/ui/contexts/workspace';
import { useLocationTracker } from '@colanode/ui/hooks/use-location-tracker';

export const WorkspaceScreen = () => {
  const { userId } = useParams({
    from: '/workspace/$userId',
  });

  const workspaceQuery = useLiveQuery((q) =>
    q
      .from({ workspaces: collections.workspaces })
      .where(({ workspaces }) => eq(workspaces.userId, userId))
      .select(({ workspaces }) => ({
        userId: workspaces.userId,
        workspaceId: workspaces.workspaceId,
        role: workspaces.role,
        accountId: workspaces.accountId,
      }))
      .findOne()
  );

  const accountQuery = useLiveQuery((q) =>
    q
      .from({ accounts: collections.accounts })
      .where(({ accounts }) => eq(accounts.id, workspaceQuery.data?.accountId))
      .select(({ accounts }) => ({
        server: accounts.server,
      }))
      .findOne()
  );

  const role = workspaceQuery.data?.role;
  const workspaceId = workspaceQuery.data?.workspaceId;
  const accountId = workspaceQuery.data?.accountId;
  const server = accountQuery.data?.server;

  useLocationTracker(userId!);

  if (!workspaceId || !accountId || !server) {
    return <WorkspaceNotFound />;
  }

  if (!userId || !role) {
    return <WorkspaceNotFound />;
  }

  return (
    <ServerProvider domain={server}>
      <WorkspaceContext.Provider
        value={{ accountId: accountId, workspaceId: workspaceId, userId, role }}
      >
        <WorkspaceLayout />
      </WorkspaceContext.Provider>
    </ServerProvider>
  );
};
