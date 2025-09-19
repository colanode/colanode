import { useParams } from '@tanstack/react-router';

import { Workspace } from '@colanode/ui/components/workspaces/workspace';
import { useAccount } from '@colanode/ui/contexts/account';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const WorkspaceContainer = () => {
  const account = useAccount();
  const { workspaceId } = useParams({ from: '/$workspaceId' });

  const workspaceQuery = useLiveQuery({
    type: 'workspace.get',
    accountId: account.id,
    workspaceId: workspaceId,
  });

  const workspace = workspaceQuery.data;
  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  return <Workspace workspace={workspace} />;
};
