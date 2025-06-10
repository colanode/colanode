import { useState } from 'react';

import { Account as AccountType } from '@colanode/client/types';
import { AccountLogout } from '@colanode/ui/components/accounts/account-logout';
import { AccountSettingsDialog } from '@colanode/ui/components/accounts/account-settings-dialog';
import { Workspace } from '@colanode/ui/components/workspaces/workspace';
import { WorkspaceCreate } from '@colanode/ui/components/workspaces/workspace-create';
import { AccountContext } from '@colanode/ui/contexts/account';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface AccountProps {
  account: AccountType;
}

export const Account = ({ account }: AccountProps) => {
  const [openSettings, setOpenSettings] = useState(false);
  const [openLogout, setOpenLogout] = useState(false);
  const [openCreateWorkspace, setOpenCreateWorkspace] = useState(false);

  const accountMetadataListQuery = useQuery({
    type: 'account.metadata.list',
    accountId: account.id,
  });

  const workspaceListQuery = useQuery({
    type: 'workspace.list',
    accountId: account.id,
  });

  if (accountMetadataListQuery.isPending || workspaceListQuery.isPending) {
    return null;
  }

  const workspaceMetadata = accountMetadataListQuery.data?.find(
    (metadata) => metadata.key === 'workspace'
  );

  const workspace =
    workspaceListQuery.data?.find(
      (workspace) => workspace.id === workspaceMetadata?.value
    ) || workspaceListQuery.data?.[0];

  const handleWorkspaceCreateSuccess = (id: string) => {
    setOpenCreateWorkspace(false);
    window.colanode.executeMutation({
      type: 'account.metadata.update',
      accountId: account.id,
      key: 'workspace',
      value: id,
    });
  };

  const handleWorkspaceCreateCancel =
    (workspaceListQuery.data?.length || 0) > 0
      ? () => setOpenCreateWorkspace(false)
      : undefined;

  return (
    <AccountContext.Provider
      value={{
        ...account,
        openSettings: () => setOpenSettings(true),
        openLogout: () => setOpenLogout(true),
        openWorkspaceCreate: () => setOpenCreateWorkspace(true),
        openWorkspace: (id) => {
          setOpenCreateWorkspace(false);
          window.colanode.executeMutation({
            type: 'account.metadata.update',
            accountId: account.id,
            key: 'workspace',
            value: id,
          });
        },
      }}
    >
      {!openCreateWorkspace && workspace ? (
        <Workspace workspace={workspace} />
      ) : (
        <WorkspaceCreate
          onSuccess={handleWorkspaceCreateSuccess}
          onCancel={handleWorkspaceCreateCancel}
        />
      )}
      {openSettings && (
        <AccountSettingsDialog
          open={true}
          onOpenChange={() => setOpenSettings(false)}
        />
      )}
      {openLogout && (
        <AccountLogout
          onCancel={() => setOpenLogout(false)}
          onLogout={() => {
            setOpenLogout(false);
          }}
        />
      )}
    </AccountContext.Provider>
  );
};
