import React from 'react';

import { AccountLogout } from '@/renderer/components/accounts/account-logout';
import { AccountSettingsDialog } from '@/renderer/components/accounts/account-settings-dialog';
import { AccountContext } from '@/renderer/contexts/account';
import { Account as AccountType } from '@/shared/types/accounts';
import { useQuery } from '@/renderer/hooks/use-query';
import { WorkspaceCreate } from '@/renderer/components/workspaces/workspace-create';
import { Workspace } from '@/renderer/components/workspaces/workspace';
import { ServerProvider } from '@/renderer/components/servers/server-provider';

interface AccountProps {
  account: AccountType;
}

export const Account = ({ account }: AccountProps) => {
  const [openSettings, setOpenSettings] = React.useState(false);
  const [openLogout, setOpenLogout] = React.useState(false);
  const [openCreateWorkspace, setOpenCreateWorkspace] = React.useState(false);

  const { data: metadata, isPending: isPendingMetadata } = useQuery({
    type: 'account_metadata_list',
    accountId: account.id,
  });

  const { data: workspaces, isPending: isPendingWorkspaces } = useQuery({
    type: 'workspace_list',
    accountId: account.id,
  });

  if (isPendingMetadata || isPendingWorkspaces) {
    return null;
  }

  const workspaceMetadata = metadata?.find(
    (metadata) => metadata.key === 'workspace'
  );

  const workspace =
    workspaces?.find(
      (workspace) => workspace.id === workspaceMetadata?.value
    ) || workspaces?.[0];

  const handleWorkspaceCreateSuccess = (id: string) => {
    setOpenCreateWorkspace(false);
    window.colanode.executeMutation({
      type: 'account_metadata_save',
      accountId: account.id,
      key: 'workspace',
      value: id,
    });
  };

  const handleWorkspaceCreateCancel =
    (workspaces?.length || 0) > 0
      ? () => setOpenCreateWorkspace(false)
      : undefined;

  return (
    <ServerProvider domain={account.server}>
      <AccountContext.Provider
        value={{
          ...account,
          openSettings: () => setOpenSettings(true),
          openLogout: () => setOpenLogout(true),
          openWorkspaceCreate: () => setOpenCreateWorkspace(true),
          openWorkspace: (id) => {
            setOpenCreateWorkspace(false);
            window.colanode.executeMutation({
              type: 'account_metadata_save',
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
    </ServerProvider>
  );
};
