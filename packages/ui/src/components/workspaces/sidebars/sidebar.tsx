import { useCallback } from 'react';

import { SidebarMenuType } from '@colanode/client/types';
import { SidebarChats } from '@colanode/ui/components/workspaces/sidebars/sidebar-chats';
import { SidebarMenu } from '@colanode/ui/components/workspaces/sidebars/sidebar-menu';
import { SidebarSettings } from '@colanode/ui/components/workspaces/sidebars/sidebar-settings';
import { SidebarSpaces } from '@colanode/ui/components/workspaces/sidebars/sidebar-spaces';
import { useApp } from '@colanode/ui/contexts/app';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { cn } from '@colanode/ui/lib/utils';
import { useAppStore } from '@colanode/ui/stores/app';

const DEFAULT_MENU = 'spaces';

export const Sidebar = () => {
  const app = useApp();
  const workspace = useWorkspace();
  const mutation = useMutation();

  const updateWorkspaceMetadata = useAppStore(
    (state) => state.updateWorkspaceMetadata
  );

  const menu =
    useAppStore((state) => {
      const account = state.accounts[workspace.accountId];
      if (!account) {
        return undefined;
      }

      const workspaceState = account.workspaces[workspace.id];
      if (!workspaceState) {
        return undefined;
      }

      return workspaceState.metadata.sidebarMenu;
    }) ?? DEFAULT_MENU;

  const handleMenuChange = useCallback(
    (newMenu: SidebarMenuType) => {
      mutation.mutate({
        input: {
          type: 'workspace.metadata.update',
          key: 'sidebar.menu',
          value: newMenu,
          accountId: workspace.accountId,
          workspaceId: workspace.id,
        },
      });

      updateWorkspaceMetadata(workspace.accountId, workspace.id, {
        key: 'sidebar.menu',
        value: newMenu,
      });
    },
    [workspace.accountId, workspace.id, menu]
  );

  return (
    <div
      className={cn(
        'flex h-full min-h-full max-h-full w-full min-w-full flex-row',
        app.type === 'mobile' ? 'bg-background' : 'bg-sidebar'
      )}
    >
      <SidebarMenu value={menu} onChange={handleMenuChange} />
      <div className="min-h-0 flex-grow overflow-auto border-l border-sidebar-border">
        {menu === 'spaces' && <SidebarSpaces />}
        {menu === 'chats' && <SidebarChats />}
        {menu === 'settings' && <SidebarSettings />}
      </div>
    </div>
  );
};
