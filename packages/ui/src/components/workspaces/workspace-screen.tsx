import { eq, useLiveQuery } from '@tanstack/react-db';
import { useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

import { WorkspaceLayout } from '@colanode/ui/components/workspaces/workspace-layout';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { useAccount } from '@colanode/ui/contexts/account';
import { WorkspaceContext } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';
import { useLocationTracker } from '@colanode/ui/hooks/use-location-tracker';

export const WorkspaceScreen = () => {
  const { workspaceId } = useParams({
    from: '/acc/$accountId/$workspaceId',
  });

  const account = useAccount();
  const workspacesQuery = useLiveQuery((q) =>
    q
      .from({ workspaces: database.accountWorkspaces(account.id) })
      .where(({ workspaces }) => eq(workspaces.id, workspaceId))
      .select(({ workspaces }) => ({
        userId: workspaces.userId,
        role: workspaces.role,
      }))
  );

  const userId = workspacesQuery.data?.[0]?.userId;
  const role = workspacesQuery.data?.[0]?.role;

  useLocationTracker(account.id, workspaceId);

  useEffect(() => {
    const accountMetadataCollection = database.accountMetadata(account.id);
    const workspaceMetadata = accountMetadataCollection.get('workspace');
    if (workspaceMetadata) {
      if (workspaceMetadata.value !== workspaceId) {
        accountMetadataCollection.update('workspace', (metadata) => {
          metadata.value = workspaceId;
        });
      }
    } else {
      accountMetadataCollection.insert({
        key: 'workspace',
        value: workspaceId,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
    }
  }, [workspaceId]);

  if (!userId || !role) {
    return <WorkspaceNotFound />;
  }

  return (
    <WorkspaceContext.Provider
      value={{ accountId: account.id, id: workspaceId, userId, role }}
    >
      <WorkspaceLayout />
    </WorkspaceContext.Provider>
  );
};
