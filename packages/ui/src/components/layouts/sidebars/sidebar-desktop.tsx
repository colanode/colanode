import { Resizable } from 're-resizable';
import { useCallback } from 'react';

import { Sidebar } from '@colanode/ui/components/layouts/sidebars/sidebar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useAppStore } from '@colanode/ui/stores/app';

const DEFAULT_WIDTH = 300;

export const SidebarDesktop = () => {
  const workspace = useWorkspace();
  const mutation = useMutation();
  const updateWorkspaceMetadata = useAppStore(
    (state) => state.updateWorkspaceMetadata
  );

  const width =
    useAppStore((state) => {
      const account = state.accounts[workspace.accountId];
      if (!account) {
        return undefined;
      }

      const workspaceState = account.workspaces[workspace.id];
      if (!workspaceState) {
        return undefined;
      }

      return workspaceState.metadata.sidebarWidth;
    }) ?? DEFAULT_WIDTH;

  const handleResize = useCallback(
    (newWidth: number) => {
      mutation.mutate({
        input: {
          type: 'workspace.metadata.update',
          key: 'sidebar.width',
          value: newWidth,
          accountId: workspace.accountId,
          workspaceId: workspace.id,
        },
      });

      updateWorkspaceMetadata(workspace.accountId, workspace.id, {
        key: 'sidebar.width',
        value: newWidth,
      });
    },
    [workspace.accountId, workspace.id]
  );

  return (
    <Resizable
      as="aside"
      size={{ width, height: '100vh' }}
      className="border-r border-sidebar-border"
      minWidth={200}
      maxWidth={500}
      enable={{
        bottom: false,
        bottomLeft: false,
        bottomRight: false,
        left: false,
        right: true,
        top: false,
        topLeft: false,
        topRight: false,
      }}
      handleClasses={{
        right: 'opacity-0 hover:opacity-100 bg-blue-300 z-30',
      }}
      handleStyles={{
        right: {
          width: '3px',
          right: '-3px',
        },
      }}
      onResize={(_, __, ref) => {
        handleResize(ref.offsetWidth);
      }}
    >
      <Sidebar />
    </Resizable>
  );
};
