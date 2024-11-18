import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/renderer/contexts/account';
import { useQuery } from '@/renderer/hooks/use-query';

export const WorkspaceRedirect = (): React.ReactNode => {
  const account = useAccount();
  const navigate = useNavigate();

  const { data, isPending } = useQuery({
    type: 'workspace_list',
    accountId: account.id,
  });

  const workspaces = data ?? [];
  React.useEffect(() => {
    if (isPending) {
      return;
    }

    if (workspaces.length == 0) {
      navigate(`/${account.id}/create`);
      return;
    }

    navigate(`/${account.id}/${workspaces[0].id}`);
  }, [workspaces, navigate, isPending]);

  return null;
};
