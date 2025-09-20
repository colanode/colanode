import { useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

import { Layout } from '@colanode/ui/components/layouts/layout';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { WorkspaceContext } from '@colanode/ui/contexts/workspace';
import { useLocationTracker } from '@colanode/ui/hooks/use-location-tracker';
import { useAppStore } from '@colanode/ui/stores/app';

export const WorkspaceScreen = () => {
  const { accountId, workspaceId } = useParams({
    from: '/acc/$accountId/$workspaceId',
  });

  const userId = useAppStore(
    (state) => state.accounts[accountId]?.workspaces[workspaceId]?.userId
  );

  const role = useAppStore(
    (state) => state.accounts[accountId]?.workspaces[workspaceId]?.role
  );

  useLocationTracker(accountId, workspaceId);

  useEffect(() => {
    useAppStore.getState().updateAccountMetadata(accountId, {
      key: 'workspace',
      value: workspaceId,
    });

    window.colanode.executeMutation({
      type: 'account.metadata.update',
      accountId: accountId,
      key: 'workspace',
      value: workspaceId,
    });
  }, [accountId, workspaceId]);

  if (!userId || !role) {
    return <WorkspaceNotFound />;
  }

  return (
    <WorkspaceContext.Provider
      value={{ accountId, id: workspaceId, userId, role }}
    >
      <Layout />
    </WorkspaceContext.Provider>
  );
};
