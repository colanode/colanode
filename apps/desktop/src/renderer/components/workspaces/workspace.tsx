import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { Layout } from '@/renderer/components/layouts/layout';
import { WorkspaceSettingsDialog } from '@/renderer/components/workspaces/workspace-settings-dialog';
import { useAccount } from '@/renderer/contexts/account';
import { WorkspaceContext } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

export const Workspace = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const account = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();

  const [openSettings, setOpenSettings] = React.useState(false);

  const { data } = useQuery({
    type: 'workspace_get',
    accountId: account.id,
    workspaceId: workspaceId!,
  });

  const workspace = data ?? null;

  if (!workspace) {
    return <p>Workspace not found</p>;
  }

  const main = searchParams.get('main');
  const modal = searchParams.get('modal');
  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        openInMain(nodeId) {
          setSearchParams((prev) => {
            prev.set('main', nodeId);
            if (nodeId === modal) {
              prev.delete('modal');
            }
            return prev;
          });
        },
        isNodeActive(id) {
          return id === main;
        },
        isModalActive(id) {
          return id === modal;
        },
        openInModal(modal) {
          setSearchParams((prev) => {
            prev.set('modal', modal);
            return prev;
          });
        },
        closeModal() {
          setSearchParams((prev) => {
            prev.delete('modal');
            return prev;
          });
        },
        closeMain() {
          setSearchParams((prev) => {
            prev.delete('main');
            return prev;
          });
        },
        closeNode(id) {
          if (id === main) {
            setSearchParams((prev) => {
              prev.delete('main');
              return prev;
            });
          } else if (id === modal) {
            setSearchParams((prev) => {
              prev.delete('modal');
              return prev;
            });
          }
        },
        openSettings() {
          setOpenSettings(true);
        },
      }}
    >
      <Layout main={main} modal={modal} />
      {openSettings && (
        <WorkspaceSettingsDialog
          open={openSettings}
          onOpenChange={() => setOpenSettings(false)}
        />
      )}
    </WorkspaceContext.Provider>
  );
};
