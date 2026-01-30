import { eq, useLiveQuery } from '@tanstack/react-db';

import { collections } from '@colanode/ui/collections';
import { ServerProvider } from '@colanode/ui/components/servers/server-provider';
import { WorkspaceLayout } from '@colanode/ui/components/workspaces/workspace-layout';
import { WorkspaceLocationTracker } from '@colanode/ui/components/workspaces/workspace-location-tracker';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { WorkspaceContext } from '@colanode/ui/contexts/workspace';

interface WorkspaceProps {
  userId: string;
}

export const Workspace = ({ userId }: WorkspaceProps) => {
  const workspaceQuery = useLiveQuery(
    (q) =>
      q
        .from({ workspaces: collections.workspaces })
        .where(({ workspaces }) => eq(workspaces.userId, userId))
        .select(({ workspaces }) => ({
          userId: workspaces.userId,
          workspaceId: workspaces.workspaceId,
          role: workspaces.role,
          accountId: workspaces.accountId,
        }))
        .findOne(),
    [userId]
  );

  const accountQuery = useLiveQuery(
    (q) =>
      q
        .from({ accounts: collections.accounts })
        .where(({ accounts }) =>
          eq(accounts.id, workspaceQuery.data?.accountId)
        )
        .select(({ accounts }) => ({
          server: accounts.server,
        }))
        .findOne(),
    [workspaceQuery.data?.accountId]
  );

  const role = workspaceQuery.data?.role;
  const workspaceId = workspaceQuery.data?.workspaceId;
  const accountId = workspaceQuery.data?.accountId;
  const server = accountQuery.data?.server;

  if (!workspaceId || !accountId || !server) {
    return <WorkspaceNotFound />;
  }

  if (!userId || !role) {
    return <WorkspaceNotFound />;
  }

  return (
    <ServerProvider domain={server}>
      <WorkspaceContext.Provider
        value={{
          accountId: accountId,
          workspaceId: workspaceId,
          userId,
          role,
          collections: collections.workspace(userId),
        }}
      >
        <WorkspaceLocationTracker />
        <WorkspaceLayout />
      </WorkspaceContext.Provider>
    </ServerProvider>
  );
};
