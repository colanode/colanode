import { eq, inArray, useLiveQuery } from '@tanstack/react-db';
import { ChevronRight } from 'lucide-react';
import { RefAttributes, useRef } from 'react';
import { useDrop } from 'react-dnd';

import { LocalNode, LocalSpaceNode } from '@colanode/client/types';
import { extractNodeRole } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { SpaceSidebarDropdown } from '@colanode/ui/components/spaces/space-sidebar-dropdown';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@colanode/ui/components/ui/collapsible';
import { Link } from '@colanode/ui/components/ui/link';
import { WorkspaceSidebarItem } from '@colanode/ui/components/workspaces/sidebars/sidebar-item';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import {
  generateSpaceChildIndex,
  sortSpaceChildren,
} from '@colanode/ui/lib/spaces';
import { cn } from '@colanode/ui/lib/utils';

interface SpaceSidebarItemProps {
  space: LocalSpaceNode;
}

export const SpaceSidebarItem = ({ space }: SpaceSidebarItemProps) => {
  const workspace = useWorkspace();

  const role = extractNodeRole(space, workspace.userId);
  const canEdit = role === 'admin';

  const nodeChildrenGetQuery = useLiveQuery((q) =>
    q
      .from({ nodes: collections.workspace(workspace.userId).nodes })
      .where(({ nodes }) => eq(nodes.parentId, space.id))
      .where(({ nodes }) =>
        inArray(nodes.type, ['page', 'channel', 'database', 'folder'])
      )
  );

  const [dropMonitor, dropRef] = useDrop({
    accept: 'sidebar-item',
    drop: () => ({
      after: null,
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const divRef = useRef<HTMLDivElement>(null);
  const dropDivRef = dropRef(divRef);

  const children = sortSpaceChildren(space, nodeChildrenGetQuery.data ?? []);

  const handleDragEnd = (childId: string, after: string | null) => {
    const nodes = collections.workspace(workspace.userId).nodes;
    if (!nodes.has(space.id)) {
      return;
    }

    const children: LocalNode[] = [];
    for (const [, node] of nodes.entries()) {
      if (node.parentId === space.id) {
        children.push(node);
      }
    }

    const newIndex = generateSpaceChildIndex(space, children, childId, after);

    nodes.update(space.id, (draft) => {
      if (draft.attributes.type !== 'space') {
        return;
      }

      const childrenSettings = draft.attributes.children ?? {};
      childrenSettings[childId] = {
        ...(childrenSettings[childId] ?? {}),
        id: childId,
        index: newIndex,
      };

      draft.attributes.children = childrenSettings;
    });
  };

  return (
    <Collapsible
      key={space.id}
      defaultOpen={true}
      className="group/sidebar-space"
    >
      <div
        className={cn(
          'text-sm flex h-7 items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
          dropMonitor.isOver &&
            dropMonitor.canDrop &&
            'border-b-2 border-blue-300'
        )}
        ref={dropDivRef as RefAttributes<HTMLDivElement>['ref']}
      >
        <CollapsibleTrigger asChild>
          <button className="group/space-button flex items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm flex-1 cursor-pointer">
            <Avatar
              id={space.id}
              avatar={space.attributes.avatar}
              name={space.attributes.name}
              className="size-4 group-hover/space-button:hidden"
            />
            <ChevronRight className="hidden size-4 transition-transform duration-200 group-hover/space-button:block group-data-[state=open]/sidebar-space:rotate-90" />
            <span>{space.attributes.name}</span>
          </button>
        </CollapsibleTrigger>
        <SpaceSidebarDropdown space={space} />
      </div>
      <CollapsibleContent>
        <ul className="mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 mr-0 pr-0">
          {children.map((child) => (
            <li key={child.id}>
              <Link
                from="/workspace/$userId"
                to="$nodeId"
                params={{
                  nodeId: child.id,
                }}
                className="cursor-pointer select-none"
              >
                {({ isActive }) => (
                  <WorkspaceSidebarItem
                    node={child}
                    isActive={isActive}
                    canDrag={canEdit}
                    onDragEnd={(after) => {
                      handleDragEnd(child.id, after);
                    }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};
