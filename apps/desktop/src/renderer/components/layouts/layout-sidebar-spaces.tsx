import { SpaceNode } from '@colanode/core';

import { SpaceCreateButton } from '@/renderer/components/spaces/space-create-button';
import { SpaceSidebarItem } from '@/renderer/components/spaces/space-sidebar-item';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/renderer/components/ui/sidebar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

export const LayoutSidebarSpaces = () => {
  const workspace = useWorkspace();
  const canCreateSpace =
    workspace.role !== 'guest' && workspace.role !== 'none';

  const { data } = useQuery({
    type: 'node_children_get',
    userId: workspace.userId,
    nodeId: workspace.id,
    types: ['space'],
  });

  const spaces = data?.map((node) => node as SpaceNode) ?? [];

  return (
    <SidebarGroup className="group/sidebar-spaces">
      <SidebarGroupLabel>Spaces</SidebarGroupLabel>
      {canCreateSpace && (
        <SidebarGroupAction className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-spaces:opacity-100">
          <SpaceCreateButton />
        </SidebarGroupAction>
      )}
      <SidebarMenu>
        {spaces.map((space) => (
          <SpaceSidebarItem node={space} key={space.id} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
