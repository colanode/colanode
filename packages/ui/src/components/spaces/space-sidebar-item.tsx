import { ChevronRight } from 'lucide-react';
import { RefAttributes, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { toast } from 'sonner';

import { LocalSpaceNode } from '@colanode/client/types';
import { extractNodeRole } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { SidebarItem } from '@colanode/ui/components/layouts/sidebars/sidebar-item';
import { SpaceSidebarDropdown } from '@colanode/ui/components/spaces/space-sidebar-dropdown';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@colanode/ui/components/ui/collapsible';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { sortSpaceChildren } from '@colanode/ui/lib/spaces';
import { cn } from '@colanode/ui/lib/utils';

interface SpaceSidebarItemProps {
  space: LocalSpaceNode;
}

export const SpaceSidebarItem = ({ space }: SpaceSidebarItemProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();
  const mutation = useMutation();

  const role = extractNodeRole(space, workspace.userId);
  const canEdit = role === 'admin';

  const nodeChildrenGetQuery = useQuery({
    type: 'node.children.get',
    nodeId: space.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    types: ['page', 'channel', 'database', 'folder'],
  });

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
    mutation.mutate({
      input: {
        type: 'space.child.reorder',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        spaceId: space.id,
        childId,
        after,
      },
      onError(error) {
        toast.error(error.message);
      },
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
          'flex w-full min-w-0 flex-row items-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8',
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
            <li
              key={child.id}
              onClick={() => {
                layout.preview(child.id);
              }}
              onDoubleClick={() => {
                layout.open(child.id);
              }}
              className="cursor-pointer select-none"
            >
              <SidebarItem
                node={child}
                isActive={layout.activeTab === child.id}
                canDrag={canEdit}
                onDragEnd={(after) => {
                  handleDragEnd(child.id, after);
                }}
              />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};
