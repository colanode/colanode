import { Resizable } from 're-resizable';
import { useCallback, useState } from 'react';

import { Sidebar } from '@colanode/ui/components/layouts/sidebars/sidebar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';

const DEFAULT_WIDTH = 300;
const COLLAPSED_WIDTH = 65;

export const SidebarDesktop = () => {
  const workspace = useWorkspace();
  const [width, setWidth] = useMetadata<number>(
    workspace.userId,
    'sidebar.width'
  );
  const [collapsed, setCollapsed] = useState(false);

  const handleResize = useCallback(
    (newWidth: number) => {
      setWidth(newWidth);
    },
    [setWidth]
  );

  const effectiveWidth = collapsed ? COLLAPSED_WIDTH : (width ?? DEFAULT_WIDTH);

  return (
    <Resizable
      as="aside"
      size={{ width: effectiveWidth, height: '100%' }}
      className="border-r border-sidebar-border"
      minWidth={collapsed ? COLLAPSED_WIDTH : 200}
      maxWidth={collapsed ? COLLAPSED_WIDTH : 500}
      enable={{
        bottom: false,
        bottomLeft: false,
        bottomRight: false,
        left: false,
        right: !collapsed,
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
        if (!collapsed) {
          handleResize(ref.offsetWidth);
        }
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
    </Resizable>
  );
};
