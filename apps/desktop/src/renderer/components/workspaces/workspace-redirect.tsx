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
        if (workspaces.length === 0) {
          navigate(`/${account.id}/create`);
        } else {
          navigate(`/${account.id}/${workspaces[0].id}`);
        }
      });
  }, [navigate]);

  return null;
};
