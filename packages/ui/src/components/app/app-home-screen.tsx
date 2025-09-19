import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAccount } from '@colanode/ui/contexts/account';

export const AppHomeScreen = () => {
  const navigate = useNavigate();
  const account = useAccount();

  useEffect(() => {
    (async () => {
      const workspaces = await window.colanode.executeQuery({
        type: 'workspace.list',
        accountId: account.id,
      });

      if (workspaces.length === 0) {
        navigate({ to: '/create', replace: true });
        return;
      }

      const workspace = workspaces[0]!;
      navigate({
        to: '/$workspaceId',
        params: { workspaceId: workspace.id },
        replace: true,
      });
    })();
  }, [account.id]);

  return null;
};
