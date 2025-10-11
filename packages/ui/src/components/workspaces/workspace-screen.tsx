import { eq, useLiveQuery } from '@tanstack/react-db';
import { useParams } from '@tanstack/react-router';
// import { useEffect } from 'react';

import { WorkspaceLayout } from '@colanode/ui/components/workspaces/workspace-layout';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { WorkspaceContext } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';
import { useLocationTracker } from '@colanode/ui/hooks/use-location-tracker';

export const WorkspaceScreen = () => {
  const { userId } = useParams({
    from: '/workspace/$userId',
  });

  const workspaceQuery = useLiveQuery((q) =>
    q
      .from({ workspaces: database.workspaces })
      .where(({ workspaces }) => eq(workspaces.userId, userId))
      .select(({ workspaces }) => ({
        userId: workspaces.userId,
        workspaceId: workspaces.workspaceId,
        role: workspaces.role,
        accountId: workspaces.accountId,
      }))
      .findOne()
  );

  const role = workspaceQuery.data?.role;
  const workspaceId = workspaceQuery.data?.workspaceId;
  const accountId = workspaceQuery.data?.accountId;

  useLocationTracker(userId!);

  if (!workspaceId || !accountId) {
    return <WorkspaceNotFound />;
  }

  // useEffect(() => {
  //   if (!accountId) {
  //     return;
  //   }

  //   const accountMetadataCollection = database.accountMetadata;
  //   const workspaceMetadata = accountMetadataCollection.get('workspace');
  //   if (workspaceMetadata) {
  //     if (workspaceMetadata.value !== userId) {
  //       accountMetadataCollection.update('workspace', (metadata) => {
  //         metadata.value = userId;
  //       });
  //     }
  //   } else {
  //     accountMetadataCollection.insert({
  //       key: 'workspace',
  //       accountId: accountId,
  //       value: userId,
  //       createdAt: new Date().toISOString(),
  //       updatedAt: null,
  //     });
  //   }
  // }, [userId]);

  if (!userId || !role) {
    return <WorkspaceNotFound />;
  }

  return (
    <WorkspaceContext.Provider
      value={{ accountId: accountId, workspaceId: workspaceId, userId, role }}
    >
      <WorkspaceLayout />
    </WorkspaceContext.Provider>
  );
};
