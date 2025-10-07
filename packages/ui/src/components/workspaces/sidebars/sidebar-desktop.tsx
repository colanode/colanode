import { Resizable } from 're-resizable';
import { useCallback } from 'react';

import { Sidebar } from '@colanode/ui/components/workspaces/sidebars/sidebar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';
import { useWorkspaceMetadata } from '@colanode/ui/hooks/use-workspace-metadata';

const DEFAULT_WIDTH = 300;

export const SidebarDesktop = () => {
  const workspace = useWorkspace();

  const width = useWorkspaceMetadata('sidebar.width') ?? DEFAULT_WIDTH;

  const handleResize = useCallback(
    (newWidth: number) => {
      const workspaceMetadata = database.workspaceMetadata(
        workspace.accountId,
        workspace.id
      );

      const currentWidth = workspaceMetadata.get('sidebar.width');
      if (currentWidth) {
        workspaceMetadata.update('sidebar.width', (metadata) => {
          metadata.value = newWidth;
          metadata.updatedAt = new Date().toISOString();
        });
      } else {
        workspaceMetadata.insert({
          key: 'sidebar.width',
          value: newWidth,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        });
      }
    },
    [workspace.accountId, workspace.id]
  );

  return (
    <Resizable
      as="aside"
      size={{ width, height: '100%' }}
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
