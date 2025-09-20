import { useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

import { WorkspaceLayout } from '@colanode/ui/components/workspaces/workspace-layout';
import { WorkspaceMetadata } from '@colanode/ui/components/workspaces/workspace-metadata';
import { WorkspaceNotFound } from '@colanode/ui/components/workspaces/workspace-not-found';
import { useAccount } from '@colanode/ui/contexts/account';
import { useAccountMetadata } from '@colanode/ui/contexts/account-metadata';
import { WorkspaceContext } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const WorkspaceScreen = () => {
  const account = useAccount();
  const accountMetadata = useAccountMetadata();

  const { workspaceId } = useParams({ from: '/acc/$accountId/$workspaceId' });

  const workspaceQuery = useLiveQuery({
    type: 'workspace.get',
    accountId: account.id,
    workspaceId: workspaceId,
  });

  useEffect(() => {
    accountMetadata.set('workspace', workspaceId);
  }, [workspaceId]);

  if (workspaceQuery.isPending) {
    return null;
  }

  const workspace = workspaceQuery.data;
  if (!workspace) {
    return <WorkspaceNotFound />;
  }

  return (
    <WorkspaceContext.Provider value={workspace}>
      <WorkspaceMetadata>
        <WorkspaceLayout key={workspace.id} />
      </WorkspaceMetadata>
    </WorkspaceContext.Provider>
  );
};
