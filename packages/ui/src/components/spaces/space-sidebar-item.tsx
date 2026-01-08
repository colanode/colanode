import { eq, useLiveQuery } from '@tanstack/react-db';
import { ChevronRight } from 'lucide-react';

import { LocalSpaceNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { SidebarItem } from '@colanode/ui/components/layouts/sidebars/sidebar-item';
import { SpaceSidebarDropdown } from '@colanode/ui/components/spaces/space-sidebar-dropdown';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@colanode/ui/components/ui/collapsible';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { sortSpaceChildren } from '@colanode/ui/lib/spaces';

interface SpaceSidebarItemProps {
  space: LocalSpaceNode;
}

export const SpaceSidebarItem = ({ space }: SpaceSidebarItemProps) => {
  const workspace = useWorkspace();

  const nodeChildrenGetQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.parentId, space.id)),
    [workspace.userId, space.id]
  );

  const children = sortSpaceChildren(space, nodeChildrenGetQuery.data);

  return (
    <Collapsible
      key={space.id}
      defaultOpen={true}
      className="group/sidebar-space"
    >
      <div className="group/space-row text-sm flex h-7 items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 overflow-hidden rounded-md text-left text-sm flex-1 cursor-pointer">
            <Avatar
              id={space.id}
              avatar={space.avatar}
              name={space.name}
              className="size-4 group-hover/space-row:hidden"
            />
            <ChevronRight className="hidden size-4 transition-transform duration-200 group-hover/space-row:block group-data-[state=open]/sidebar-space:rotate-90 cursor-pointer rounded hover:bg-sidebar-accent/50" />
            <span>{space.name}</span>
          </button>
        </CollapsibleTrigger>
        <SpaceSidebarDropdown space={space} />
      </div>
      <CollapsibleContent>
        <ul className="ml-3 flex min-w-0 flex-col gap-0.5 py-0.5">
          {children.map((child) => (
            <li key={child.id}>
              <SidebarItem node={child} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};
