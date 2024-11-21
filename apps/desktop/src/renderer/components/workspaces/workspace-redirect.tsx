import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/renderer/contexts/account';

export const WorkspaceRedirect = (): React.ReactNode => {
  const account = useAccount();
  const navigate = useNavigate();

  React.useEffect(() => {
    window.colanode
      .executeQuery({
        type: 'workspace_list',
        accountId: account.id,
      })
      .then((data) => {
        const workspaces = data ?? [];
        const firstWorkspace = workspaces[0];
        if (firstWorkspace) {
          navigate(`/${account.id}/${firstWorkspace.id}`);
        } else {
          navigate(`/${account.id}/create`);
        }
      });
  }, [navigate]);

  return null;
};
