import React from 'react'
import {Node} from '@/types/nodes'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '@/contexts/workspace';
import {SidebarNode} from "@/components/workspaces/sidebar-node";

interface SidebarNodeChildrenProps {
  node: Node;
}

export const SidebarNodeChildren = observer(({node}: SidebarNodeChildrenProps) => {
  const workspace = useWorkspace();
  const childrenIds = node.content?.filter(c => !!c.id).map(c => c.id) ?? [];
  const children: Node[] = workspace.getNodes().filter(n => childrenIds.includes(n.id));

  return (
    <React.Fragment>
      {children.map((child) => (
        <SidebarNode key={child.id} node={child} />
      ))}
    </React.Fragment>
  )
});