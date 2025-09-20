import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAccount } from '@colanode/ui/contexts/account';
import { useAccountMetadata } from '@colanode/ui/contexts/account-metadata';

export const AccountHomeScreen = () => {
  const account = useAccount();
  const accountMetadata = useAccountMetadata();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const lastUsedWorkspace = accountMetadata.get('workspace');
      if (lastUsedWorkspace) {
        navigate({
          to: '/acc/$accountId/$workspaceId',
          replace: true,
          params: { accountId: account.id, workspaceId: lastUsedWorkspace },
        });
        return;
      }

      const workspaces = await window.colanode.executeQuery({
        type: 'workspace.list',
        accountId: account.id,
      });

      const workspace = workspaces[0]!;
      if (!workspace) {
        navigate({
          to: '/acc/$accountId/create',
          params: { accountId: account.id },
          replace: true,
        });
        return;
      }

      navigate({
        to: '/acc/$accountId/$workspaceId',
        params: { accountId: account.id, workspaceId: workspace.id },
        replace: true,
      });
    })();
  }, []);

  return null;
};
