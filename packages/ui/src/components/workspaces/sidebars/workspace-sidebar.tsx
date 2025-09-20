import { Resizable } from 're-resizable';
import { useCallback } from 'react';

import { SidebarMenuType, SidebarMetadata } from '@colanode/client/types';
import { WorkspaceSidebarChats } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-chats';
import { WorkspaceSidebarMenu } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-menu';
import { WorkspaceSidebarSettings } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-settings';
import { WorkspaceSidebarSpaces } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-spaces';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useAppStore } from '@colanode/ui/stores/app';

export const WorkspaceSidebar = () => {
  const workspace = useWorkspace();
  const sidebarMetadata = useAppStore((state) => {
    const account = state.accounts[workspace.accountId];
    if (!account) {
      return undefined;
    }

    const workspaceState = account.workspaces[workspace.id];
    if (!workspaceState) {
      return undefined;
    }

    return workspaceState.metadata.sidebar;
  });

  const updateWorkspaceMetadata = useAppStore(
    (state) => state.updateWorkspaceMetadata
  );

  const mutation = useMutation();

  const menu = sidebarMetadata?.menu ?? 'spaces';
  const width = sidebarMetadata?.width ?? 300;

  const handleSidebarResize = useCallback(
    (newWidth: number) => {
      const newSidebarMetadata: SidebarMetadata = {
        menu,
        width: newWidth,
      };

      mutation.mutate({
        input: {
          type: 'workspace.metadata.update',
          key: 'sidebar',
          value: newSidebarMetadata,
          accountId: workspace.accountId,
          workspaceId: workspace.id,
        },
      });

      updateWorkspaceMetadata(workspace.accountId, workspace.id, {
        key: 'sidebar',
        value: newSidebarMetadata,
      });
    },
    [workspace.accountId, workspace.id, menu, width]
  );

  const handleMenuChange = useCallback(
    (newMenu: SidebarMenuType) => {
      const newSidebarMetadata: SidebarMetadata = {
        menu: newMenu,
        width: width,
      };

      mutation.mutate({
        input: {
          type: 'workspace.metadata.update',
          key: 'sidebar',
          value: newSidebarMetadata,
          accountId: workspace.accountId,
          workspaceId: workspace.id,
        },
      });

      updateWorkspaceMetadata(workspace.accountId, workspace.id, {
        key: 'sidebar',
        value: newSidebarMetadata,
      });
    },
    [workspace.accountId, workspace.id, menu, width]
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
        handleSidebarResize(ref.offsetWidth);
      }}
    >
      <div className="flex h-screen min-h-screen max-h-screen w-full min-w-full flex-row bg-sidebar">
        <WorkspaceSidebarMenu value={menu} onChange={handleMenuChange} />
        <div className="min-h-0 flex-grow overflow-auto border-l border-sidebar-border">
          {menu === 'spaces' && <WorkspaceSidebarSpaces />}
          {menu === 'chats' && <WorkspaceSidebarChats />}
          {menu === 'settings' && <WorkspaceSidebarSettings />}
        </div>
      </div>
    </Resizable>
  );
};
