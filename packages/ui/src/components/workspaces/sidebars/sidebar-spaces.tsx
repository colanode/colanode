import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalSpaceNode } from '@colanode/client/types';
import { SpaceCreateButton } from '@colanode/ui/components/spaces/space-create-button';
import { SpaceSidebarItem } from '@colanode/ui/components/spaces/space-sidebar-item';
import { SidebarHeader } from '@colanode/ui/components/workspaces/sidebars/sidebar-header';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

export const SidebarSpaces = () => {
  const workspace = useWorkspace();
  const canCreateSpace =
    workspace.role !== 'guest' && workspace.role !== 'none';

  const spacesQuery = useLiveQuery((q) =>
    q
      .from({ nodes: database.workspace(workspace.userId).nodes })
      .where(({ nodes }) => eq(nodes.type, 'space'))
  );

  const spaces = spacesQuery.data as LocalSpaceNode[];

  return (
    <div className="flex flex-col group/sidebar h-full px-2">
      <SidebarHeader
        title="Spaces"
        actions={canCreateSpace && <SpaceCreateButton />}
      />
      <div className="flex w-full min-w-0 flex-col gap-1">
        {spaces.map((space) => (
          <SpaceSidebarItem space={space} key={space.id} />
        ))}
      </div>
    </div>
  );
};
