import { Resizable } from 're-resizable';
import { useCallback } from 'react';

import { Sidebar } from '@colanode/ui/components/workspaces/sidebars/sidebar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';

const DEFAULT_WIDTH = 300;

export const SidebarDesktop = () => {
  const workspace = useWorkspace();
  const [width, setWidth] = useMetadata<number>(
    workspace.userId,
    'sidebar.width'
  );

  const handleResize = useCallback(
    (newWidth: number) => {
      setWidth(newWidth);
    },
    [setWidth]
  );

  return (
    <Resizable
      as="aside"
      size={{ width: width ?? DEFAULT_WIDTH, height: '100%' }}
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
